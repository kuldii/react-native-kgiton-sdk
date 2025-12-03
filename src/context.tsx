/**
 * React Context for KGiTON Scale SDK
 * 
 * Provides global access to scale service across the app
 */

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
} from './index';

/**
 * Context value type
 */
interface ScaleContextValue {
  service: KGiTONScaleService;
  weight: WeightData | null;
  devices: ScaleDevice[];
  connectionState: ScaleConnectionState;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

/**
 * Create context with undefined default
 */
const ScaleContext = createContext<ScaleContextValue | undefined>(undefined);

/**
 * Provider props
 */
interface ScaleProviderProps {
  children: ReactNode;
  enableLogging?: boolean;
}

/**
 * Scale Context Provider
 * 
 * Wrap your app with this provider to enable global scale service access
 * 
 * @example
 * ```typescript
 * import { ScaleProvider } from '@kgiton/react-native-sdk/context';
 * 
 * function App() {
 *   return (
 *     <ScaleProvider>
 *       <YourApp />
 *     </ScaleProvider>
 *   );
 * }
 * ```
 */
export const ScaleProvider: React.FC<ScaleProviderProps> = ({
  children,
  enableLogging = true,
}) => {
  const [service] = useState(() => new KGiTONScaleService(enableLogging));
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

  const value: ScaleContextValue = {
    service,
    weight,
    devices,
    connectionState,
    isConnected: service.isConnected(),
    isAuthenticated: service.isAuthenticated(),
    error,
  };

  return <ScaleContext.Provider value={value}>{children}</ScaleContext.Provider>;
};

/**
 * Hook to access scale context
 * 
 * Must be used within ScaleProvider
 * 
 * @returns Scale context value
 * @throws Error if used outside ScaleProvider
 * 
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { service, weight, isConnected } = useScaleContext();
 *   
 *   return (
 *     <View>
 *       <Text>Weight: {weight?.weight.toFixed(3)} kg</Text>
 *     </View>
 *   );
 * }
 * ```
 */
export function useScaleContext(): ScaleContextValue {
  const context = useContext(ScaleContext);

  if (context === undefined) {
    throw new Error('useScaleContext must be used within a ScaleProvider');
  }

  return context;
}

/**
 * HOC to inject scale context as props
 * 
 * @param Component - Component to wrap
 * @returns Wrapped component with scale props
 * 
 * @example
 * ```typescript
 * interface MyComponentProps {
 *   scale: ScaleContextValue;
 * }
 * 
 * const MyComponent: React.FC<MyComponentProps> = ({ scale }) => {
 *   return <Text>Weight: {scale.weight?.weight}</Text>;
 * };
 * 
 * export default withScale(MyComponent);
 * ```
 */
export function withScale<P extends { scale: ScaleContextValue }>(
  Component: React.ComponentType<P>
) {
  const WrappedComponent: React.FC<Omit<P, 'scale'>> = (props) => {
    const scale = useScaleContext();
    return <Component {...(props as P)} scale={scale} />;
  };

  WrappedComponent.displayName = `withScale(${
    Component.displayName || Component.name || 'Component'
  })`;

  return WrappedComponent;
}
