/**
 * Data validation utilities untuk KGiTON SDK
 */
export class DataValidation {
  /**
   * Validate weight string dari device
   */
  static validateWeightString(value: string): boolean {
    if (!value || value.trim().length === 0) {
      return false;
    }

    // Check if string can be parsed to number
    const num = parseFloat(value);
    if (isNaN(num)) {
      return false;
    }

    // Weight should be reasonable (0-9999 kg)
    if (num < 0 || num > 9999) {
      return false;
    }

    return true;
  }

  /**
   * Parse weight dari string
   */
  static parseWeight(value: string): number | null {
    if (!this.validateWeightString(value)) {
      return null;
    }

    return parseFloat(value);
  }

  /**
   * Validate device ID format
   */
  static validateDeviceId(deviceId: string): boolean {
    return Boolean(deviceId && deviceId.trim().length > 0);
  }

  /**
   * Validate license key format
   */
  static validateLicenseKey(licenseKey: string): boolean {
    // License key format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (5 groups of 5 chars)
    const pattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
    const result = pattern.test(licenseKey);
    return result;
  }

  /**
   * Sanitize string input
   */
  static sanitizeString(value: string): string {
    // eslint-disable-next-line no-control-regex
    return value.trim().replace(/[\x00-\x1F\x7F]/g, '');
  }

  /**
   * Validate UUID format
   */
  static validateUUID(uuid: string): boolean {
    const pattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return pattern.test(uuid);
  }
}
