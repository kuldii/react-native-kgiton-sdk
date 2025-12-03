/**
 * Base exception class untuk KGiTON SDK
 */
export class KGiTONException extends Error {
  constructor(message: string, public originalError?: Error) {
    super(message);
    this.name = 'KGiTONException';
    Object.setPrototypeOf(this, KGiTONException.prototype);
  }
}

/**
 * Exception untuk masalah koneksi BLE
 */
export class BLEConnectionException extends KGiTONException {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'BLEConnectionException';
    Object.setPrototypeOf(this, BLEConnectionException.prototype);
  }
}

/**
 * Exception untuk device tidak ditemukan
 */
export class DeviceNotFoundException extends KGiTONException {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'DeviceNotFoundException';
    Object.setPrototypeOf(this, DeviceNotFoundException.prototype);
  }
}

/**
 * Exception untuk masalah license key
 */
export class LicenseKeyException extends KGiTONException {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'LicenseKeyException';
    Object.setPrototypeOf(this, LicenseKeyException.prototype);
  }
}

/**
 * Exception untuk authentication failure
 */
export class AuthenticationException extends KGiTONException {
  constructor(message: string, originalError?: Error) {
    super(message, originalError);
    this.name = 'AuthenticationException';
    Object.setPrototypeOf(this, AuthenticationException.prototype);
  }
}
