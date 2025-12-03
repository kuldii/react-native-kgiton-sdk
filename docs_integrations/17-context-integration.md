# Context Integration Guide

Guide for integrating the KGiTON SDK using React Context for app-wide state management.

## Overview

React Context provides a way to share scale state across your entire application without prop drilling. This guide shows how to implement a context-based architecture.

---

## Why Use Context?

✅ **Global State** - Share scale state across all components  
✅ **No Prop Drilling** - Access state anywhere in the component tree  
✅ **Centralized Logic** - All scale logic in one place  
✅ **Clean Components** - Components focus on UI, not business logic  

---

## Setup ScaleProvider

### Install SDK

```bash
npm install @kgiton/react-native-sdk
```

### Wrap Your App

```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ScaleProvider } from '@kgiton/react-native-sdk';
import AppNavigator from './navigation/AppNavigator';

const App = () => {
  return (
    <ScaleProvider enableLogging={__DEV__}>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ScaleProvider>
  );
};

export default App;
```

---

## Using useScaleContext

### Basic Usage

```typescript
// screens/HomeScreen.tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useScaleContext } from '@kgiton/react-native-sdk';

const HomeScreen = () => {
  const {
    devices,
    scan,
    isScanning,
    isConnected
  } = useScaleContext();

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text>Status: {isConnected ? 'Connected' : 'Disconnected'}</Text>
      
      <Button
        title={isScanning ? 'Scanning...' : 'Scan for Devices'}
        onPress={() => scan(15000)}
        disabled={isScanning}
      />
      
      <Text>Found {devices.length} devices</Text>
    </View>
  );
};

export default HomeScreen;
```

### Across Multiple Screens

```typescript
// screens/ScanScreen.tsx
import React from 'react';
import { View, FlatList, Button } from 'react-native';
import { useScaleContext } from '@kgiton/react-native-sdk';

const ScanScreen = ({ navigation }) => {
  const { devices, scan, connect } = useScaleContext();

  const handleConnect = async (deviceId: string) => {
    const licenseKey = 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX';
    const response = await connect(deviceId, licenseKey);
    
    if (response.success) {
      navigation.navigate('Weight');
    }
  };

  return (
    <View>
      <Button title="Scan" onPress={() => scan(15000)} />
      
      <FlatList
        data={devices}
        renderItem={({ item }) => (
          <Button
            title={item.name}
            onPress={() => handleConnect(item.id)}
          />
        )}
      />
    </View>
  );
};

// screens/WeightScreen.tsx
const WeightScreen = () => {
  const { weight, isAuthenticated, triggerBuzzer } = useScaleContext();

  if (!isAuthenticated) {
    return <Text>Not connected</Text>;
  }

  return (
    <View>
      <Text style={{ fontSize: 48 }}>
        {weight?.weight.toFixed(3)} kg
      </Text>
      <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
    </View>
  );
};

// screens/SettingsScreen.tsx
const SettingsScreen = () => {
  const { connectedDevice, disconnect, connectionState } = useScaleContext();

  return (
    <View>
      <Text>Device: {connectedDevice?.name}</Text>
      <Text>State: {connectionState}</Text>
      <Button title="Disconnect" onPress={disconnect} />
    </View>
  );
};
```

---

## Custom Context Implementation

### Create Custom Context

```typescript
// context/ScaleContext.tsx
import React, { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  useCallback,
  ReactNode 
} from 'react';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState
} from '@kgiton/react-native-sdk';

interface ScaleContextValue {
  // Service
  service: KGiTONScaleService;
  
  // State
  devices: ScaleDevice[];
  weight: WeightData | null;
  connectionState: ScaleConnectionState;
  connectedDevice: ScaleDevice | null;
  error: Error | null;
  isScanning: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
  
  // Actions
  scan: (timeout?: number) => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string, licenseKey: string) => Promise<any>;
  disconnect: () => Promise<void>;
  triggerBuzzer: (command: string) => Promise<void>;
}

const ScaleContext = createContext<ScaleContextValue | undefined>(undefined);

interface ScaleProviderProps {
  children: ReactNode;
  enableLogging?: boolean;
  autoDispose?: boolean;
}

export const ScaleProvider = ({
  children,
  enableLogging = false,
  autoDispose = true
}: ScaleProviderProps) => {
  const [service] = useState(() => new KGiTONScaleService());
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [connectionState, setConnectionState] = useState<ScaleConnectionState>('disconnected');
  const [connectedDevice, setConnectedDevice] = useState<ScaleDevice | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Derived state
  const isConnected = connectionState === 'connected';
  const isAuthenticated = isConnected && connectedDevice !== null;

  // Setup event listeners
  useEffect(() => {
    if (enableLogging) {
      service.setDebugLogging(true);
    }

    const handleWeight = (data: WeightData) => {
      setWeight(data);
    };

    const handleConnected = () => {
      setConnectionState('connected');
      setError(null);
    };

    const handleDisconnected = () => {
      setConnectionState('disconnected');
      setConnectedDevice(null);
      setWeight(null);
    };

    const handleError = (err: Error) => {
      setError(err);
      console.error('[Scale Error]', err);
    };

    const handleStateChange = (state: ScaleConnectionState) => {
      setConnectionState(state);
    };

    service.on('weight', handleWeight);
    service.on('connected', handleConnected);
    service.on('disconnected', handleDisconnected);
    service.on('error', handleError);
    service.on('connectionStateChanged', handleStateChange);

    return () => {
      service.off('weight', handleWeight);
      service.off('connected', handleConnected);
      service.off('disconnected', handleDisconnected);
      service.off('error', handleError);
      service.off('connectionStateChanged', handleStateChange);

      if (autoDispose) {
        service.dispose();
      }
    };
  }, [service, enableLogging, autoDispose]);

  // Actions
  const scan = useCallback(async (timeout = 15000) => {
    setIsScanning(true);
    try {
      const foundDevices = await service.scanForDevices(timeout);
      setDevices(foundDevices);
    } catch (err: any) {
      setError(err);
      throw err;
    } finally {
      setIsScanning(false);
    }
  }, [service]);

  const stopScan = useCallback(() => {
    service.stopScan();
    setIsScanning(false);
  }, [service]);

  const connect = useCallback(async (deviceId: string, licenseKey: string) => {
    try {
      const response = await service.connectWithLicenseKey(deviceId, licenseKey);
      
      if (response.success) {
        const device = devices.find(d => d.id === deviceId);
        setConnectedDevice(device || null);
      }
      
      return response;
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [service, devices]);

  const disconnect = useCallback(async () => {
    try {
      await service.disconnect();
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [service]);

  const triggerBuzzer = useCallback(async (command: string) => {
    try {
      await service.triggerBuzzer(command);
    } catch (err: any) {
      setError(err);
      throw err;
    }
  }, [service]);

  const value: ScaleContextValue = {
    service,
    devices,
    weight,
    connectionState,
    connectedDevice,
    error,
    isScanning,
    isConnected,
    isAuthenticated,
    scan,
    stopScan,
    connect,
    disconnect,
    triggerBuzzer
  };

  return (
    <ScaleContext.Provider value={value}>
      {children}
    </ScaleContext.Provider>
  );
};

export const useScaleContext = (): ScaleContextValue => {
  const context = useContext(ScaleContext);
  
  if (context === undefined) {
    throw new Error('useScaleContext must be used within a ScaleProvider');
  }
  
  return context;
};
```

---

## Enhanced Context with Features

### Context with Persistence

```typescript
// context/EnhancedScaleContext.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DEVICE_KEY = '@last_device';

export const EnhancedScaleProvider = ({ children }: { children: ReactNode }) => {
  // ... existing state ...
  const [lastDevice, setLastDevice] = useState<{
    deviceId: string;
    licenseKey: string;
  } | null>(null);

  // Load last device on mount
  useEffect(() => {
    const loadLastDevice = async () => {
      try {
        const data = await AsyncStorage.getItem(LAST_DEVICE_KEY);
        if (data) {
          setLastDevice(JSON.parse(data));
        }
      } catch (error) {
        console.error('Failed to load last device:', error);
      }
    };

    loadLastDevice();
  }, []);

  // Enhanced connect with persistence
  const connectWithPersistence = useCallback(async (
    deviceId: string,
    licenseKey: string
  ) => {
    const response = await connect(deviceId, licenseKey);
    
    if (response.success) {
      const deviceData = { deviceId, licenseKey };
      await AsyncStorage.setItem(LAST_DEVICE_KEY, JSON.stringify(deviceData));
      setLastDevice(deviceData);
    }
    
    return response;
  }, [connect]);

  // Reconnect to last device
  const reconnectToLast = useCallback(async () => {
    if (lastDevice) {
      return await connectWithPersistence(
        lastDevice.deviceId,
        lastDevice.licenseKey
      );
    }
    throw new Error('No previous device found');
  }, [lastDevice, connectWithPersistence]);

  const value = {
    // ... existing value ...
    connectWithPersistence,
    reconnectToLast,
    lastDevice
  };

  return (
    <ScaleContext.Provider value={value}>
      {children}
    </ScaleContext.Provider>
  );
};
```

### Context with Auto-Reconnect

```typescript
// Add auto-reconnect logic
useEffect(() => {
  let reconnectTimer: NodeJS.Timeout;
  let attempts = 0;
  const maxAttempts = 5;

  if (
    connectionState === 'disconnected' &&
    lastDevice &&
    attempts < maxAttempts
  ) {
    reconnectTimer = setTimeout(async () => {
      console.log(`Auto-reconnect attempt ${attempts + 1}/${maxAttempts}`);
      attempts++;
      
      try {
        await connectWithPersistence(
          lastDevice.deviceId,
          lastDevice.licenseKey
        );
        attempts = 0; // Reset on success
      } catch (error) {
        console.error('Auto-reconnect failed:', error);
      }
    }, 2000 * attempts); // Exponential backoff
  }

  return () => {
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
    }
  };
}, [connectionState, lastDevice]);
```

---

## Complete App Example

### App Structure

```
src/
├── context/
│   └── ScaleContext.tsx
├── screens/
│   ├── HomeScreen.tsx
│   ├── ScanScreen.tsx
│   ├── WeightScreen.tsx
│   └── SettingsScreen.tsx
├── components/
│   ├── DeviceList.tsx
│   ├── WeightDisplay.tsx
│   └── BuzzerControls.tsx
├── navigation/
│   └── AppNavigator.tsx
└── App.tsx
```

### App.tsx

```typescript
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { ScaleProvider } from './context/ScaleContext';
import AppNavigator from './navigation/AppNavigator';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  return (
    <ErrorBoundary>
      <ScaleProvider enableLogging={__DEV__}>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </ScaleProvider>
    </ErrorBoundary>
  );
};

export default App;
```

### AppNavigator.tsx

```typescript
import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from '../screens/HomeScreen';
import ScanScreen from '../screens/ScanScreen';
import WeightScreen from '../screens/WeightScreen';
import SettingsScreen from '../screens/SettingsScreen';

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Scan" component={ScanScreen} />
      <Stack.Screen name="Weight" component={WeightScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
```

### HomeScreen.tsx

```typescript
import React from 'react';
import { View, Button, Text, StyleSheet } from 'react-native';
import { useScaleContext } from '../context/ScaleContext';

const HomeScreen = ({ navigation }) => {
  const { isConnected, connectedDevice, reconnectToLast, lastDevice } = useScaleContext();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KGiTON Scale</Text>
      
      <Text style={styles.status}>
        Status: {isConnected ? 'Connected' : 'Disconnected'}
      </Text>
      
      {isConnected && connectedDevice && (
        <Text>Device: {connectedDevice.name}</Text>
      )}

      {!isConnected && (
        <>
          {lastDevice && (
            <Button
              title="Reconnect to Last Device"
              onPress={reconnectToLast}
            />
          )}
          
          <Button
            title="Scan for Devices"
            onPress={() => navigation.navigate('Scan')}
          />
        </>
      )}

      {isConnected && (
        <>
          <Button
            title="View Weight"
            onPress={() => navigation.navigate('Weight')}
          />
          
          <Button
            title="Settings"
            onPress={() => navigation.navigate('Settings')}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  status: {
    fontSize: 16,
    marginBottom: 20,
    textAlign: 'center'
  }
});

export default HomeScreen;
```

### ScanScreen.tsx

```typescript
import React, { useEffect } from 'react';
import {
  View,
  FlatList,
  Button,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useScaleContext } from '../context/ScaleContext';

const ScanScreen = ({ navigation }) => {
  const {
    devices,
    scan,
    stopScan,
    connect,
    isScanning
  } = useScaleContext();

  useEffect(() => {
    // Auto-start scan on mount
    scan(15000);

    return () => {
      stopScan();
    };
  }, []);

  const handleConnect = async (deviceId: string) => {
    Alert.prompt(
      'Enter License Key',
      'Format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
      async (licenseKey) => {
        if (licenseKey) {
          try {
            const response = await connect(deviceId, licenseKey);
            
            if (response.success) {
              navigation.navigate('Weight');
            } else {
              Alert.alert('Connection Failed', response.message);
            }
          } catch (error: any) {
            Alert.alert('Error', error.message);
          }
        }
      }
    );
  };

  const renderDevice = ({ item }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
      </View>
      <Button title="Connect" onPress={() => handleConnect(item.id)} />
    </View>
  );

  return (
    <View style={styles.container}>
      <Button
        title={isScanning ? 'Stop Scan' : 'Scan Again'}
        onPress={isScanning ? stopScan : () => scan(15000)}
      />

      {isScanning && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text>Scanning for devices...</Text>
        </View>
      )}

      <FlatList
        data={devices}
        renderItem={renderDevice}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !isScanning && (
            <Text style={styles.emptyText}>No devices found</Text>
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20
  },
  loadingContainer: {
    alignItems: 'center',
    marginVertical: 20
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginVertical: 5
  },
  deviceInfo: {
    flex: 1
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  deviceRssi: {
    fontSize: 12,
    color: '#666',
    marginTop: 4
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    marginTop: 20
  }
});

export default ScanScreen;
```

### WeightScreen.tsx

```typescript
import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useScaleContext } from '../context/ScaleContext';

const WeightScreen = ({ navigation }) => {
  const {
    weight,
    isAuthenticated,
    triggerBuzzer,
    disconnect
  } = useScaleContext();

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text>Not connected to scale</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  const handleDisconnect = async () => {
    await disconnect();
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <View style={styles.weightCard}>
        <Text style={styles.weightLabel}>Current Weight</Text>
        <Text style={styles.weight}>
          {weight ? weight.weight.toFixed(3) : '---.-'}
        </Text>
        <Text style={styles.unit}>{weight?.unit || 'kg'}</Text>
      </View>

      <View style={styles.controls}>
        <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
        <Button title="Buzz" onPress={() => triggerBuzzer('BUZZ')} />
        <Button title="Long" onPress={() => triggerBuzzer('LONG')} />
      </View>

      <Button
        title="Disconnect"
        onPress={handleDisconnect}
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center'
  },
  weightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 30
  },
  weightLabel: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10
  },
  weight: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333'
  },
  unit: {
    fontSize: 24,
    color: '#666',
    marginTop: 10
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 30
  }
});

export default WeightScreen;
```

---

## Best Practices

### 1. Single Provider at Root

```typescript
// ✅ GOOD - Provider at root
<ScaleProvider>
  <App />
</ScaleProvider>

// ❌ BAD - Multiple providers
<Screen1>
  <ScaleProvider>...</ScaleProvider>
</Screen1>
<Screen2>
  <ScaleProvider>...</ScaleProvider>
</Screen2>
```

### 2. Error Boundaries

```typescript
<ErrorBoundary>
  <ScaleProvider>
    <App />
  </ScaleProvider>
</ErrorBoundary>
```

### 3. Context Validation

```typescript
export const useScaleContext = () => {
  const context = useContext(ScaleContext);
  
  if (!context) {
    throw new Error('useScaleContext must be used within ScaleProvider');
  }
  
  return context;
};
```

### 4. Memoize Context Value

```typescript
const value = useMemo(() => ({
  service,
  devices,
  weight,
  // ... other values
}), [service, devices, weight]);

return (
  <ScaleContext.Provider value={value}>
    {children}
  </ScaleContext.Provider>
);
```

---

## See Also

- [Context API Reference](./10-api-context.md)
- [Hooks Integration Guide](./16-hooks-integration.md)
- [Basic Integration Guide](./15-basic-integration.md)
- [Performance Guide](./13-performance.md)
