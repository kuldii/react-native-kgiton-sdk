import { BleManager, Device, Subscription, State } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BLEConstants } from './constants';
import {
  ScaleDevice,
  ScaleDeviceFactory,
  WeightData,
  WeightDataFactory,
  ControlResponse,
  ControlResponseFactory,
  ScaleConnectionState,
  ConnectionStateHelpers,
} from './models';
import {
  BLEConnectionException,
  DeviceNotFoundException,
  LicenseKeyException,
} from './exceptions';
import { DataValidation, RetryPolicy, ConnectionStability, stringToBase64, base64ToString } from './utils';

/**
 * Event types for KGiTON Scale Service
 */
export interface KGiTONEvents {
  onWeightData: (data: WeightData) => void;
  onConnectionStateChange: (state: ScaleConnectionState) => void;
  onDevicesFound: (devices: ScaleDevice[]) => void;
  onError: (error: Error) => void;
}

/**
 * KGiTON Scale Service
 *
 * Service utama untuk komunikasi dengan timbangan ESP32 via BLE.
 *
 * Fitur:
 * - Connect/Disconnect dengan license key
 * - Streaming data berat realtime
 * - Kontrol buzzer
 * - Autentikasi perangkat
 */
export class KGiTONScaleService {
  private bleManager: BleManager;
  private connectedDevice: Device | null = null;
  private txCharacteristicId: string | null = null;
  private controlCharacteristicId: string | null = null;
  private buzzerCharacteristicId: string | null = null;

  // Subscriptions
  private scanSubscription: Subscription | Promise<void> | null = null;
  private dataSubscription: Subscription | null = null;
  private controlSubscription: Subscription | null = null;

  // State
  private connectionState: ScaleConnectionState = ScaleConnectionState.DISCONNECTED;
  private availableDevices: ScaleDevice[] = [];
  private connectionStability = new ConnectionStability();

  // Event handlers
  private eventHandlers: Partial<KGiTONEvents> = {};

  // Storage key untuk license key mapping
  private static readonly STORAGE_KEY = 'kgiton_device_licenses';

  // Control response promise
  private controlResponseResolve: ((value: string) => void) | null = null;

  // Performance optimization flags
  private enableLogging: boolean;
  private enableDebugLogging: boolean = false;
  private lastWeightTimestamp: number = 0;

  /**
   * Constructor
   */
  constructor(enableLogging = true) {
    this.bleManager = new BleManager();
    this.enableLogging = enableLogging;
    if (enableLogging) {
      this.log('KGiTON Scale Service initialized');
    }
  }

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Set event handlers
   */
  setEventHandlers(handlers: Partial<KGiTONEvents>): void {
    this.eventHandlers = { ...this.eventHandlers, ...handlers };
  }

  /**
   * Remove event handler
   */
  removeEventHandler(event: keyof KGiTONEvents): void {
    delete this.eventHandlers[event];
  }

  // ============================================
  // GETTERS
  // ============================================

  /**
   * Status koneksi saat ini
   */
  getConnectionState(): ScaleConnectionState {
    return this.connectionState;
  }

  /**
   * Apakah sedang terhubung
   */
  isConnected(): boolean {
    return ConnectionStateHelpers.isConnected(this.connectionState);
  }

  /**
   * Apakah sudah terautentikasi
   */
  isAuthenticated(): boolean {
    return ConnectionStateHelpers.isAuthenticated(this.connectionState);
  }

  /**
   * Device yang terhubung
   */
  getConnectedDevice(): ScaleDevice | null {
    if (!this.connectedDevice) return null;

    const device = this.availableDevices.find((d) => d.id === this.connectedDevice!.id);
    return device || null;
  }

  /**
   * Daftar perangkat yang tersedia
   */
  getAvailableDevices(): ScaleDevice[] {
    return [...this.availableDevices];
  }

  // ============================================
  // PUBLIC METHODS - BLUETOOTH STATE
  // ============================================

  /**
   * Check if Bluetooth is enabled
   */
  async isBluetoothEnabled(): Promise<boolean> {
    const state = await this.bleManager.state();
    return state === State.PoweredOn;
  }

  /**
   * Request Bluetooth to be enabled
   */
  async enableBluetooth(): Promise<void> {
    const state = await this.bleManager.state();
    if (state !== State.PoweredOn) {
      // On iOS, this will show a system dialog
      // On Android, user needs to enable manually
      throw new BLEConnectionException(
        'Bluetooth tidak aktif. Silakan aktifkan Bluetooth terlebih dahulu.'
      );
    }
  }

  // ============================================
  // PUBLIC METHODS - SCANNING
  // ============================================

  /**
   * Scan untuk menemukan perangkat timbangan
   */
  async scanForDevices(timeoutMs?: number): Promise<void> {
    if (this.connectionState === ScaleConnectionState.SCANNING) {
      this.log('Already scanning', 'warn');
      return;
    }

    // Check Bluetooth state
    const state = await this.bleManager.state();
    this.log(`Bluetooth state: ${state}`);
    
    if (state !== State.PoweredOn) {
      const errorMsg = `Bluetooth not ready. State: ${state}`;
      this.log(errorMsg, 'error');
      throw new BLEConnectionException(errorMsg);
    }

    this.updateConnectionState(ScaleConnectionState.SCANNING);
    this.availableDevices = [];
    this.emitDevicesFound();

    const scanTimeout = timeoutMs || BLEConstants.SCAN_TIMEOUT;
    this.log(`Starting BLE scan for ${BLEConstants.DEVICE_NAME} (timeout: ${scanTimeout}ms)`);

    try {
      // Load license key map untuk mapping ke device
      const licenseMap = await this.loadLicenseKeyMap();

      const subscription = this.bleManager.startDeviceScan(
        null,
        { allowDuplicates: false },
        (error, device) => {
          if (error) {
            this.log(`Scan error: ${error.message}`, 'error');
            this.stopScan();
            return;
          }

          if (device) {
            // Only log in debug mode to reduce overhead
            if (this.enableDebugLogging) {
              console.debug(`[KGiTON SDK] Device: ${device.name || 'Unknown'} (${device.id})`);
            }
            
            if (device.name) {
              // Fast filter: name must contain "KGiTON" (case-insensitive)
              if (device.name.toUpperCase().includes(BLEConstants.DEVICE_NAME.toUpperCase())) {
                const licenseKey = licenseMap[device.id];
                const scaleDevice = ScaleDeviceFactory.fromBleDevice(
                  device.name,
                  device.id,
                  device.rssi || 0,
                  licenseKey
                );

                // Check if device already in list
                const existingIndex = this.availableDevices.findIndex((d) => d.id === device.id);
                if (existingIndex >= 0) {
                  // Update RSSI silently
                  this.availableDevices[existingIndex] = scaleDevice;
                } else {
                  this.availableDevices.push(scaleDevice);
                  this.log(
                    `✓ Device found: ${device.name}${licenseKey ? ' (has license)' : ''}`
                  );
                }

                this.emitDevicesFound();
              }
            }
          }
        }
      );
      
      this.scanSubscription = subscription;

      // Auto stop setelah timeout
      setTimeout(() => {
        if (this.connectionState === ScaleConnectionState.SCANNING) {
          this.stopScan();
          this.log(`Scan completed - found ${this.availableDevices.length} device(s)`);

          if (this.availableDevices.length === 0) {
            this.updateConnectionState(ScaleConnectionState.DISCONNECTED);
          }
        }
      }, scanTimeout);
    } catch (error) {
      this.log(`Failed to start scan: ${error}`, 'error');
      this.updateConnectionState(ScaleConnectionState.ERROR);
      throw new BLEConnectionException(
        `Gagal memulai scan: ${error}`,
        error as Error
      );
    }
  }

  /**
   * Stop scanning
   */
  stopScan(): void {
    if (this.scanSubscription) {
      this.bleManager.stopDeviceScan();
      this.scanSubscription = null;
    }

    if (this.connectionState === ScaleConnectionState.SCANNING) {
      this.updateConnectionState(ScaleConnectionState.DISCONNECTED);
    }

    this.log('Scan stopped');
  }

  // ============================================
  // PUBLIC METHODS - CONNECTION
  // ============================================

  /**
   * Connect ke perangkat dengan license key
   */
  async connectWithLicenseKey(deviceId: string, licenseKey: string): Promise<ControlResponse> {
    this.log(`Connecting with license key to device: ${deviceId}`);

    // Validasi device ada dalam daftar
    if (!this.availableDevices.some((d) => d.id === deviceId)) {
      throw new DeviceNotFoundException(`Device ${deviceId} tidak ditemukan`);
    }

    // Validasi license key format
    if (!DataValidation.validateLicenseKey(licenseKey)) {
      throw new LicenseKeyException('Format license key tidak valid');
    }

    try {
      // Connect ke device
      await this.connectToDevice(deviceId);

      // Send CONNECT command dengan license key
      const response = await this.sendControlCommand(`CONNECT:${licenseKey}`);

      // Jika berhasil connect, simpan license key ke storage
      if (response.success) {
        await this.saveLicenseKey(deviceId, licenseKey);

        // Update device di list dengan license key
        const deviceIndex = this.availableDevices.findIndex((d) => d.id === deviceId);
        if (deviceIndex >= 0) {
          this.availableDevices[deviceIndex] = ScaleDeviceFactory.copyWith(
            this.availableDevices[deviceIndex],
            { licenseKey }
          );
          this.emitDevicesFound();
        }
      }

      return response;
    } catch (error) {
      this.log(`Connect failed, ensuring cleanup: ${error}`, 'error');
      await this.disconnectDevice();
      throw error;
    }
  }

  /**
   * Disconnect dari perangkat dengan license key
   */
  async disconnectWithLicenseKey(licenseKey: string): Promise<ControlResponse> {
    if (!this.isConnected()) {
      return ControlResponseFactory.error('Tidak terhubung ke perangkat');
    }

    this.log('Disconnecting with license key');

    // Send DISCONNECT command dengan license key
    const response = await this.sendControlCommand(`DISCONNECT:${licenseKey}`);

    // Disconnect BLE
    await this.disconnectDevice();

    return response;
  }

  /**
   * Disconnect tanpa license key (force disconnect)
   */
  async disconnect(): Promise<void> {
    this.log('Force disconnect');
    await this.disconnectDevice();
  }

  // ============================================
  // PUBLIC METHODS - BUZZER
  // ============================================

  /**
   * Trigger buzzer dengan perintah tertentu
   * 
   * Commands: BUZZ, BEEP, ON, LONG, OFF
   */
  async triggerBuzzer(command: string): Promise<void> {
    if (!this.isAuthenticated()) {
      throw new BLEConnectionException('Tidak terhubung atau belum terautentikasi');
    }

    if (!this.buzzerCharacteristicId || !this.connectedDevice) {
      throw new BLEConnectionException('Buzzer characteristic tidak tersedia');
    }

    this.log(`Triggering buzzer: ${command}`);

    try {
      const base64Data = stringToBase64(command);
      await this.connectedDevice.writeCharacteristicWithoutResponseForService(
        BLEConstants.SERVICE_UUID,
        this.buzzerCharacteristicId,
        base64Data
      );
      this.log('Buzzer command sent successfully');
    } catch (error) {
      this.log(`Failed to trigger buzzer: ${error}`, 'error');
      throw new BLEConnectionException(
        `Gagal mengirim perintah buzzer: ${error}`,
        error as Error
      );
    }
  }

  // ============================================
  // PRIVATE METHODS - CONNECTION
  // ============================================

  private async connectToDevice(deviceId: string): Promise<void> {
    this.updateConnectionState(ScaleConnectionState.CONNECTING);
    this.log(`Connecting to ${deviceId}...`);

    try {
      // Connect dengan timeout
      this.connectedDevice = await RetryPolicy.executeWithTimeout(
        () => this.bleManager.connectToDevice(deviceId),
        BLEConstants.CONNECTION_TIMEOUT,
        'Connection timeout'
      );

      // Discover services dan characteristics
      await this.connectedDevice.discoverAllServicesAndCharacteristics();

      // Find characteristics
      const services = await this.connectedDevice.services();
      let targetService = null;

      for (const service of services) {
        if (service.uuid.toLowerCase() === BLEConstants.SERVICE_UUID.toLowerCase()) {
          targetService = service;
          break;
        }
      }

      if (!targetService) {
        throw new BLEConnectionException('Service timbangan tidak ditemukan');
      }

      const characteristics = await targetService.characteristics();

      for (const char of characteristics) {
        const uuid = char.uuid.toLowerCase();

        if (uuid === BLEConstants.TX_CHARACTERISTIC_UUID.toLowerCase()) {
          this.txCharacteristicId = char.uuid;
          this.log('TX characteristic found');
        } else if (uuid === BLEConstants.CONTROL_CHARACTERISTIC_UUID.toLowerCase()) {
          this.controlCharacteristicId = char.uuid;
          this.log('Control characteristic found');
        } else if (uuid === BLEConstants.BUZZER_CHARACTERISTIC_UUID.toLowerCase()) {
          this.buzzerCharacteristicId = char.uuid;
          this.log('Buzzer characteristic found');
        }
      }

      // Validasi characteristics yang diperlukan
      if (!this.txCharacteristicId || !this.controlCharacteristicId) {
        throw new BLEConnectionException('Karakteristik yang diperlukan tidak ditemukan');
      }

      // Setup control listener
      await this.setupControlListener();

      this.updateConnectionState(ScaleConnectionState.CONNECTED);
      this.connectionStability.trackConnection(deviceId);

      this.log('Connected successfully');
    } catch (error) {
      this.log(`Connection failed: ${error}`, 'error');
      this.handleDisconnection();
      throw new BLEConnectionException(`Gagal terhubung: ${error}`, error as Error);
    }
  }

  private async setupControlListener(): Promise<void> {
    if (!this.controlCharacteristicId || !this.connectedDevice) return;

    try {
      this.controlSubscription = this.connectedDevice.monitorCharacteristicForService(
        BLEConstants.SERVICE_UUID,
        this.controlCharacteristicId,
        (error, characteristic) => {
          if (error) {
            if (this.enableLogging) {
              console.error(`[KGiTON SDK] Control stream error: ${error.message}`);
            }
            return;
          }

          if (characteristic?.value) {
            const response = base64ToString(characteristic.value).trim();
            
            if (this.enableDebugLogging) {
              console.log(`[KGiTON SDK] Control response: ${response}`);
            }

            // Resolve promise immediately
            if (this.controlResponseResolve) {
              this.controlResponseResolve(response);
              this.controlResponseResolve = null;
            }
          }
        }
      );

      this.log('Control listener setup completed');
    } catch (error) {
      this.log(`Failed to setup control listener: ${error}`, 'error');
    }
  }

  private async setupDataListener(): Promise<void> {
    if (!this.txCharacteristicId || !this.connectedDevice) return;

    try {
      this.log('Setting up data listener...');

      this.dataSubscription = this.connectedDevice.monitorCharacteristicForService(
        BLEConstants.SERVICE_UUID,
        this.txCharacteristicId,
        (error, characteristic) => {
          if (error) {
            // Only log errors, not every callback
            if (this.enableLogging) {
              console.error(`[KGiTON SDK] Data stream error: ${error.message}`);
            }
            return;
          }

          if (characteristic?.value) {
            try {
              // Fast path: decode and parse in one go
              const weightStr = base64ToString(characteristic.value).trim();
              
              // Only log raw data in debug mode
              if (this.enableDebugLogging) {
                console.debug(`[KGiTON SDK] Raw: "${weightStr}"`);
              }

              const weight = DataValidation.parseWeight(weightStr);

              if (weight !== null) {
                const now = Date.now();
                const weightData = WeightDataFactory.create(weight);
                
                // Emit immediately without delay
                this.emitWeightData(weightData);
                
                // Only log occasionally (every 500ms) to reduce overhead
                if (this.enableLogging && (now - this.lastWeightTimestamp) > 500) {
                  console.log(`[KGiTON SDK] Weight: ${WeightDataFactory.getDisplayWeight(weightData)}`);
                  this.lastWeightTimestamp = now;
                }
              } else if (this.enableDebugLogging) {
                console.warn(`[KGiTON SDK] Invalid format: "${weightStr}"`);
              }
            } catch (error) {
              if (this.enableLogging) {
                console.error(`[KGiTON SDK] Processing error: ${error}`);
              }
            }
          }
        }
      );

      this.log('Data listener active - optimized for realtime streaming');
    } catch (error) {
      this.log(`Failed to setup data listener: ${error}`, 'error');
    }
  }

  private async sendControlCommand(command: string): Promise<ControlResponse> {
    if (!this.controlCharacteristicId || !this.connectedDevice) {
      throw new BLEConnectionException('Control characteristic tidak tersedia');
    }

    this.log(`Sending control command: ${command}`);

    try {
      const base64Data = stringToBase64(command);
      await this.connectedDevice.writeCharacteristicWithResponseForService(
        BLEConstants.SERVICE_UUID,
        this.controlCharacteristicId,
        base64Data
      );

      // Tunggu response dari notification stream
      const responseStr = await new Promise<string>((resolve, reject) => {
        this.controlResponseResolve = resolve;

        setTimeout(() => {
          if (this.controlResponseResolve) {
            this.controlResponseResolve = null;
            reject(new Error('TIMEOUT'));
          }
        }, BLEConstants.COMMAND_TIMEOUT);
      });

      this.log(`Control response: ${responseStr}`);

      const response = ControlResponseFactory.fromDeviceResponse(responseStr);

      // Update state berdasarkan response
      if (response.success) {
        if (responseStr === 'CONNECTED' || responseStr === 'ALREADY_CONNECTED') {
          this.updateConnectionState(ScaleConnectionState.AUTHENTICATED);
          await this.setupDataListener();

          // Trigger buzzer sukses (hanya untuk CONNECTED, bukan ALREADY_CONNECTED)
          if (responseStr === 'CONNECTED') {
            try {
              await this.triggerBuzzer('BUZZ');
            } catch (error) {
              this.log(`Failed to trigger success buzzer: ${error}`, 'warn');
            }
          }
        } else if (responseStr === 'DISCONNECTED') {
          this.updateConnectionState(ScaleConnectionState.CONNECTED);
        }
      } else {
        // Auto-disconnect jika autentikasi gagal
        this.log(`Control command failed: ${response.message}. Auto-disconnecting...`, 'warn');
        await this.disconnectDevice();
      }

      return response;
    } catch (error) {
      this.log(`Control command failed: ${error}`, 'error');
      throw new BLEConnectionException(`Gagal mengirim perintah: ${error}`, error as Error);
    }
  }

  private async disconnectDevice(): Promise<void> {
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.cancelConnection();
      } catch (error) {
        this.log(`Disconnect error: ${error}`, 'warn');
      }
    }

    this.handleDisconnection();
  }

  private handleDisconnection(): void {
    this.log('Handling disconnection');

    const deviceId = this.connectedDevice?.id;
    if (deviceId) {
      this.connectionStability.trackDisconnection(deviceId);
    }

    this.connectedDevice = null;
    this.txCharacteristicId = null;
    this.controlCharacteristicId = null;
    this.buzzerCharacteristicId = null;

    this.dataSubscription?.remove();
    this.controlSubscription?.remove();
    this.dataSubscription = null;
    this.controlSubscription = null;
    this.controlResponseResolve = null;

    this.updateConnectionState(ScaleConnectionState.DISCONNECTED);
  }

  // ============================================
  // PRIVATE METHODS - UTILITIES
  // ============================================

  private updateConnectionState(newState: ScaleConnectionState): void {
    if (this.connectionState !== newState) {
      this.connectionState = newState;
      this.emitConnectionStateChange();
      this.log(`Connection state: ${ConnectionStateHelpers.getDisplayName(newState)}`);
    }
  }

  private log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info'): void {
    // Early return if logging is disabled (except for errors)
    if (!this.enableLogging && level !== 'error') return;
    if (level === 'debug' && !this.enableDebugLogging) return;

    const prefix = '[KGiTON SDK]';
    switch (level) {
      case 'debug':
        console.debug(`${prefix} ${message}`);
        break;
      case 'info':
        console.log(`${prefix} ${message}`);
        break;
      case 'warn':
        console.warn(`${prefix} ${message}`);
        break;
      case 'error':
        console.error(`${prefix} ${message}`);
        break;
    }
  }

  // ============================================
  // PRIVATE METHODS - LICENSE KEY STORAGE
  // ============================================

  private async saveLicenseKey(deviceId: string, licenseKey: string): Promise<void> {
    try {
      const licenseMap = await this.loadLicenseKeyMap();
      licenseMap[deviceId] = licenseKey;

      const jsonString = JSON.stringify(licenseMap);
      await AsyncStorage.setItem(KGiTONScaleService.STORAGE_KEY, jsonString);

      this.log(`License key saved for device: ${deviceId}`);
    } catch (error) {
      this.log(`Failed to save license key: ${error}`, 'error');
    }
  }

  private async loadLicenseKeyMap(): Promise<Record<string, string>> {
    try {
      const jsonString = await AsyncStorage.getItem(KGiTONScaleService.STORAGE_KEY);

      if (jsonString) {
        return JSON.parse(jsonString);
      }

      return {};
    } catch (error) {
      this.log(`Failed to load license key map: ${error}`, 'error');
      return {};
    }
  }

  // ============================================
  // PRIVATE METHODS - EVENT EMITTERS
  // ============================================

  private emitWeightData(data: WeightData): void {
    this.eventHandlers.onWeightData?.(data);
  }

  private emitConnectionStateChange(): void {
    this.eventHandlers.onConnectionStateChange?.(this.connectionState);
  }

  private emitDevicesFound(): void {
    this.eventHandlers.onDevicesFound?.([...this.availableDevices]);
  }

  // Unused but kept for potential future use
  // private emitError(error: Error): void {
  //   this.eventHandlers.onError?.(error);
  // }

  // ============================================
  // CLEANUP
  // ============================================

  /**
   * Enable/disable debug logging
   * 
   * Debug logging includes raw data and detailed traces.
   * Disable for production to maximize performance.
   */
  setDebugLogging(enabled: boolean): void {
    this.enableDebugLogging = enabled;
    this.log(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Enable/disable all logging
   * 
   * Errors will still be logged even if disabled.
   */
  setLogging(enabled: boolean): void {
    this.enableLogging = enabled;
  }

  /**
   * Dispose - hanya panggil saat app closing
   */
  async dispose(): Promise<void> {
    this.log('Disposing KGiTON Scale Service');

    this.stopScan();
    await this.disconnectDevice();

    this.eventHandlers = {};
    this.connectionStability.clear();

    // Destroy BLE manager
    await this.bleManager.destroy();
  }
}
