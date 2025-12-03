/**
 * KGiTON BLE Scale SDK for React Native
 *
 * React Native SDK untuk integrasi timbangan berbasis ESP32 via BLE.
 * Mendukung autentikasi license key, kontrol buzzer, dan streaming data berat realtime.
 */

// Core Service
export { KGiTONScaleService } from './KGiTONScaleService';
export type { KGiTONEvents } from './KGiTONScaleService';

// Models
export {
  ScaleDeviceFactory,
  WeightDataFactory,
  ControlResponseFactory,
  ScaleConnectionState,
  ConnectionStateHelpers,
} from './models';
export type {
  ScaleDevice,
  WeightData,
  ControlResponse,
} from './models';

// Constants
export { BLEConstants } from './constants';

// Exceptions
export {
  KGiTONException,
  BLEConnectionException,
  DeviceNotFoundException,
  LicenseKeyException,
  AuthenticationException,
} from './exceptions';

// Utilities
export { DataValidation, ConnectionStability } from './utils';
export type { RetryPolicy } from './utils';

// React Hooks (Optional)
export {
  useKGiTONScale,
  useDeviceScan,
  useDeviceConnection,
  useBuzzer,
  useWeight,
} from './hooks';

// React Context (Optional)
export { ScaleProvider, useScaleContext, withScale } from './context';
