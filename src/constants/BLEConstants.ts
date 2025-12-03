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

  // Timeouts (in milliseconds)
  static readonly SCAN_TIMEOUT = 20000;
  static readonly CONNECTION_TIMEOUT = 20000;
  static readonly COMMAND_TIMEOUT = 5000;

  // Retry Configuration
  static readonly MAX_RETRY_ATTEMPTS = 3;
  static readonly RETRY_DELAY = 2000;
}
