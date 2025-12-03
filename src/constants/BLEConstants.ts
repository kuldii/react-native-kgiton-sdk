/**
 * BLE Constants untuk KGiTON Scale
 * 
 * UUID dan konfigurasi yang sesuai dengan firmware ESP32
 */
export class BLEConstants {
  // Device Configuration
  static readonly DEVICE_NAME = 'KGiTON';

  // Service UUID
  static readonly SERVICE_UUID = '12345678-1234-1234-1234-123456789abc';

  // Characteristic UUIDs
  static readonly TX_CHARACTERISTIC_UUID = 'abcd1234-1234-1234-1234-123456789abc'; // Data berat
  static readonly CONTROL_CHARACTERISTIC_UUID = 'abcd0002-1234-1234-1234-123456789abc'; // Kontrol koneksi
  static readonly BUZZER_CHARACTERISTIC_UUID = 'abcd9999-1234-1234-1234-123456789abc'; // Kontrol buzzer

  // Timeouts (in milliseconds) - Optimized for realtime performance
  static readonly SCAN_TIMEOUT = 15000; // Reduced from 20s to 15s
  static readonly CONNECTION_TIMEOUT = 10000; // Reduced from 20s to 10s  
  static readonly COMMAND_TIMEOUT = 3000; // Reduced from 5s to 3s
  static readonly DATA_THROTTLE_MS = 0; // No throttling for realtime data

  // Retry Configuration
  static readonly MAX_RETRY_ATTEMPTS = 3;
  static readonly RETRY_DELAY = 1000; // Reduced from 2s to 1s
}
