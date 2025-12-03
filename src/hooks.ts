/**
 * React Hooks for KGiTON Scale SDK
 * 
 * Optional hooks to simplify SDK integration in React Native apps
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
  ControlResponse,
} from './index';

/**
 * Hook for managing KGiTON Scale Service
 * 
 * @param enableLogging - Enable SDK logging (default: true)
 * @returns Scale service instance and state
 * 
 * @example
 * ```typescript
 * const { service, weight, devices, connectionState, isConnected } = useKGiTONScale();
 * ```
 */
export function useKGiTONScale(enableLogging = true) {
  const serviceRef = useRef<KGiTONScaleService>();
  
  // Initialize service once
  if (!serviceRef.current) {
    serviceRef.current = new KGiTONScaleService(enableLogging);
  }

  const service = serviceRef.current;

  const [weight, setWeight] = useState<WeightData | null>(null);
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [connectionState, setConnectionState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Setup event handlers
    service.setEventHandlers({
      onWeightData: setWeight,
      onDevicesFound: setDevices,
      onConnectionStateChange: setConnectionState,
      onError: setError,
    });

    // Cleanup on unmount
    return () => {
      service.dispose();
    };
  }, [service]);

  const isConnected = service.isConnected();
  const isAuthenticated = service.isAuthenticated();

  return {
    service,
    weight,
    devices,
    connectionState,
    isConnected,
    isAuthenticated,
    error,
  };
}

/**
 * Hook for scanning devices
 * 
 * @param service - KGiTONScaleService instance
 * @param timeoutMs - Scan timeout in milliseconds
 * @returns Scan functions and state
 * 
 * @example
 * ```typescript
 * const { scan, stopScan, isScanning } = useDeviceScan(service);
 * ```
 */
export function useDeviceScan(
  service: KGiTONScaleService,
  timeoutMs = 15000
) {
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scan = useCallback(async () => {
    try {
      setError(null);
      setIsScanning(true);
      await service.scanForDevices(timeoutMs);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsScanning(false);
    }
  }, [service, timeoutMs]);

  const stopScan = useCallback(() => {
    service.stopScan();
    setIsScanning(false);
  }, [service]);

  return {
    scan,
    stopScan,
    isScanning,
    error,
  };
}

/**
 * Hook for device connection
 * 
 * @param service - KGiTONScaleService instance
 * @returns Connection functions and state
 * 
 * @example
 * ```typescript
 * const { connect, disconnect, isConnecting } = useDeviceConnection(service);
 * await connect(deviceId, licenseKey);
 * ```
 */
export function useDeviceConnection(service: KGiTONScaleService) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const connect = useCallback(
    async (deviceId: string, licenseKey: string): Promise<ControlResponse> => {
      try {
        setError(null);
        setIsConnecting(true);
        const response = await service.connectWithLicenseKey(deviceId, licenseKey);
        return response;
      } catch (err) {
        setError(err as Error);
        throw err;
      } finally {
        setIsConnecting(false);
      }
    },
    [service]
  );

  const disconnect = useCallback(async () => {
    try {
      setError(null);
      await service.disconnect();
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [service]);

  const disconnectWithKey = useCallback(
    async (licenseKey: string): Promise<ControlResponse> => {
      try {
        setError(null);
        const response = await service.disconnectWithLicenseKey(licenseKey);
        return response;
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [service]
  );

  return {
    connect,
    disconnect,
    disconnectWithKey,
    isConnecting,
    error,
  };
}

/**
 * Hook for buzzer control
 * 
 * @param service - KGiTONScaleService instance
 * @returns Buzzer control functions
 * 
 * @example
 * ```typescript
 * const { beep, buzz, longBeep, turnOff } = useBuzzer(service);
 * await beep();
 * ```
 */
export function useBuzzer(service: KGiTONScaleService) {
  const [error, setError] = useState<Error | null>(null);

  const triggerBuzzer = useCallback(
    async (command: string) => {
      try {
        setError(null);
        await service.triggerBuzzer(command);
      } catch (err) {
        setError(err as Error);
        throw err;
      }
    },
    [service]
  );

  const beep = useCallback(() => triggerBuzzer('BEEP'), [triggerBuzzer]);
  const buzz = useCallback(() => triggerBuzzer('BUZZ'), [triggerBuzzer]);
  const longBeep = useCallback(() => triggerBuzzer('LONG'), [triggerBuzzer]);
  const turnOff = useCallback(() => triggerBuzzer('OFF'), [triggerBuzzer]);

  return {
    beep,
    buzz,
    longBeep,
    turnOff,
    triggerBuzzer,
    error,
  };
}

/**
 * Hook for weight data processing
 * 
 * @param weightData - Current weight data
 * @returns Processed weight values
 * 
 * @example
 * ```typescript
 * const { formatted, display, raw, isValid } = useWeight(weight);
 * ```
 */
export function useWeight(weightData: WeightData | null) {
  const [history, setHistory] = useState<WeightData[]>([]);

  useEffect(() => {
    if (weightData) {
      setHistory((prev) => [...prev.slice(-9), weightData]);
    }
  }, [weightData]);

  const formatted = weightData ? weightData.weight.toFixed(3) : null;
  const display = weightData ? `${formatted} ${weightData.unit}` : null;
  const raw = weightData?.weight ?? null;
  const isValid = raw !== null && raw >= 0 && raw < 9999;

  const average =
    history.length > 0
      ? history.reduce((sum, w) => sum + w.weight, 0) / history.length
      : null;

  return {
    formatted,
    display,
    raw,
    isValid,
    history,
    average,
  };
}
