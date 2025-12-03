/**
 * Response dari control command
 */
export interface ControlResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}

/**
 * Factory untuk ControlResponse
 */
export class ControlResponseFactory {
  /**
   * Parse response dari device
   */
  static fromDeviceResponse(response: string): ControlResponse {
    const timestamp = new Date();

    // Success responses
    if (response === 'CONNECTED') {
      return {
        success: true,
        message: 'Terhubung dengan sukses',
        timestamp,
      };
    }

    if (response === 'ALREADY_CONNECTED') {
      return {
        success: true,
        message: 'Sudah terhubung sebelumnya',
        timestamp,
      };
    }

    if (response === 'DISCONNECTED') {
      return {
        success: true,
        message: 'Terputus dengan sukses',
        timestamp,
      };
    }

    if (response === 'ALREADY_DISCONNECTED') {
      return {
        success: true,
        message: 'Sudah terputus sebelumnya',
        timestamp,
      };
    }

    // Error responses
    if (response.startsWith('ERROR:')) {
      const errorType = response.substring(6);
      let message: string;

      switch (errorType) {
        case 'INVALID_KEY':
          message = 'License key tidak valid';
          break;
        case 'INVALID_FORMAT':
          message = 'Format perintah salah';
          break;
        case 'UNKNOWN_COMMAND':
          message = 'Perintah tidak dikenal';
          break;
        default:
          message = `Error: ${errorType}`;
      }

      return { success: false, message, timestamp };
    }

    // Unknown response
    return {
      success: false,
      message: `Response tidak dikenal: ${response}`,
      timestamp,
    };
  }

  /**
   * Create error response
   */
  static error(message: string): ControlResponse {
    return {
      success: false,
      message,
      timestamp: new Date(),
    };
  }

  /**
   * Create success response
   */
  static success(message: string): ControlResponse {
    return {
      success: true,
      message,
      timestamp: new Date(),
    };
  }
}
