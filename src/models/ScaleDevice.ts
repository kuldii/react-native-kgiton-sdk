/**
 * Model untuk perangkat timbangan
 */
export interface ScaleDevice {
  name: string;
  id: string;
  rssi: number;
  licenseKey?: string; // License key yang berhasil connect (opsional)
}

/**
 * Factory untuk membuat ScaleDevice dari BLE device
 */
export class ScaleDeviceFactory {
  static fromBleDevice(
    name: string,
    id: string,
    rssi: number,
    licenseKey?: string
  ): ScaleDevice {
    return {
      name,
      id,
      rssi,
      licenseKey,
    };
  }

  /**
   * Copy device dengan data baru
   */
  static copyWith(
    device: ScaleDevice,
    updates: Partial<ScaleDevice>
  ): ScaleDevice {
    return {
      ...device,
      ...updates,
    };
  }

  /**
   * Konversi ke Map untuk storage
   */
  static toMap(device: ScaleDevice): Record<string, unknown> {
    return {
      name: device.name,
      id: device.id,
      rssi: device.rssi,
      licenseKey: device.licenseKey,
    };
  }

  /**
   * Konversi dari Map untuk storage
   */
  static fromMap(map: Record<string, unknown>): ScaleDevice {
    return {
      name: map.name as string,
      id: map.id as string,
      rssi: map.rssi as number,
      licenseKey: map.licenseKey as string | undefined,
    };
  }

  /**
   * Convert to string untuk debugging
   */
  static toString(device: ScaleDevice): string {
    return `ScaleDevice(name: ${device.name}, id: ${device.id}, rssi: ${device.rssi}, licenseKey: ${device.licenseKey ? '***' : 'null'})`;
  }

  /**
   * Equality check berdasarkan ID
   */
  static equals(device1: ScaleDevice, device2: ScaleDevice): boolean {
    return device1.id === device2.id;
  }
}
