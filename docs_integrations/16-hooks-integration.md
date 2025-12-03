# Hooks Integration Guide

Advanced guide for integrating the KGiTON SDK using React Hooks patterns.

## Overview

This guide demonstrates how to leverage React Hooks for clean, maintainable integration of the KGiTON SDK in your application.

---

## Why Use Hooks?

✅ **Simpler Code** - Less boilerplate than class components  
✅ **Better Reusability** - Custom hooks can be shared across components  
✅ **Cleaner Effects** - Easier to manage side effects and cleanup  
✅ **Type Safety** - Full TypeScript support with proper type inference  

---

## Basic Setup

### Install and Configure

```bash
npm install @kgiton/react-native-sdk
```

### Import Hooks

```typescript
import {
  useKGiTONScale,
  useDeviceScan,
  useDeviceConnection,
  useWeight,
  useBuzzer
} from '@kgiton/react-native-sdk';
```

---

## Using useKGiTONScale Hook

### Simple Implementation

```typescript
// App.tsx
import React from 'react';
import { View, Button, Text } from 'react-native';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const App = () => {
  const {
    devices,
    weight,
    isScanning,
    isConnected,
    scan,
    connect,
    disconnect,
    triggerBuzzer
  } = useKGiTONScale();

  const handleScan = async () => {
    await scan(15000);
  };

  const handleConnect = async (deviceId: string) => {
    const licenseKey = 'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX';
    await connect(deviceId, licenseKey);
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {!isConnected ? (
        <>
          <Button
            title={isScanning ? 'Scanning...' : 'Scan'}
            onPress={handleScan}
          />
          
          {devices.map(device => (
            <Button
              key={device.id}
              title={`Connect to ${device.name}`}
              onPress={() => handleConnect(device.id)}
            />
          ))}
        </>
      ) : (
        <>
          <Text style={{ fontSize: 48 }}>
            {weight?.weight.toFixed(3)} kg
          </Text>
          
          <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
          <Button title="Disconnect" onPress={disconnect} />
        </>
      )}
    </View>
  );
};

export default App;
```

---

## Custom Hooks

### useScaleConnection - Connection Management

```typescript
// hooks/useScaleConnection.ts
import { useState, useCallback } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';
import { Alert } from 'react-native';
import { getLicenseKey } from '../utils/license';

export const useScaleConnection = () => {
  const { connect, disconnect, isConnected, connectionState } = useKGiTONScale();
  const [loading, setLoading] = useState(false);

  const connectToDevice = useCallback(async (deviceId: string) => {
    setLoading(true);
    
    try {
      const licenseKey = await getLicenseKey();
      
      if (!licenseKey) {
        Alert.alert('Error', 'No license key found');
        return false;
      }

      const response = await connect(deviceId, licenseKey);
      
      if (!response.success) {
        Alert.alert('Connection Failed', response.message);
        return false;
      }

      return true;
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [connect]);

  const disconnectFromDevice = useCallback(async () => {
    setLoading(true);
    
    try {
      await disconnect();
      return true;
    } catch (error: any) {
      Alert.alert('Disconnection Error', error.message);
      return false;
    } finally {
      setLoading(false);
    }
  }, [disconnect]);

  return {
    connectToDevice,
    disconnectFromDevice,
    isConnected,
    connectionState,
    loading
  };
};
```

**Usage:**

```typescript
const MyComponent = () => {
  const { connectToDevice, disconnectFromDevice, loading } = useScaleConnection();

  return (
    <>
      <Button
        title="Connect"
        onPress={() => connectToDevice('device-id')}
        disabled={loading}
      />
      <Button
        title="Disconnect"
        onPress={disconnectFromDevice}
        disabled={loading}
      />
    </>
  );
};
```

### useWeightTracking - Weight Data Management

```typescript
// hooks/useWeightTracking.ts
import { useState, useEffect, useCallback } from 'react';
import { useWeight } from '@kgiton/react-native-sdk';

export const useWeightTracking = () => {
  const weight = useWeight();
  const [history, setHistory] = useState<number[]>([]);
  const [average, setAverage] = useState(0);
  const [min, setMin] = useState(0);
  const [max, setMax] = useState(0);

  useEffect(() => {
    if (weight) {
      setHistory(prev => {
        const newHistory = [...prev, weight.weight].slice(-100); // Keep last 100
        
        // Calculate statistics
        const sum = newHistory.reduce((a, b) => a + b, 0);
        setAverage(sum / newHistory.length);
        setMin(Math.min(...newHistory));
        setMax(Math.max(...newHistory));
        
        return newHistory;
      });
    }
  }, [weight]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    setAverage(0);
    setMin(0);
    setMax(0);
  }, []);

  return {
    current: weight,
    history,
    statistics: {
      average,
      min,
      max,
      count: history.length
    },
    clearHistory
  };
};
```

**Usage:**

```typescript
const WeightStats = () => {
  const { current, statistics, clearHistory } = useWeightTracking();

  return (
    <View>
      <Text>Current: {current?.weight.toFixed(3)} kg</Text>
      <Text>Average: {statistics.average.toFixed(3)} kg</Text>
      <Text>Min: {statistics.min.toFixed(3)} kg</Text>
      <Text>Max: {statistics.max.toFixed(3)} kg</Text>
      <Text>Count: {statistics.count}</Text>
      <Button title="Clear" onPress={clearHistory} />
    </View>
  );
};
```

### useDeviceList - Enhanced Device Scanning

```typescript
// hooks/useDeviceList.ts
import { useState, useCallback } from 'react';
import { useDeviceScan, ScaleDevice } from '@kgiton/react-native-sdk';

export const useDeviceList = () => {
  const { devices, scan, isScanning, stopScan } = useDeviceScan();
  const [sortBy, setSortBy] = useState<'rssi' | 'name'>('rssi');

  const sortedDevices = [...devices].sort((a, b) => {
    if (sortBy === 'rssi') {
      return b.rssi - a.rssi; // Stronger signal first
    } else {
      return a.name.localeCompare(b.name); // Alphabetical
    }
  });

  const startScan = useCallback(async (timeout = 15000) => {
    try {
      await scan(timeout);
    } catch (error) {
      console.error('Scan failed:', error);
    }
  }, [scan]);

  const filterBySignal = useCallback((minRssi: number) => {
    return sortedDevices.filter(device => device.rssi >= minRssi);
  }, [sortedDevices]);

  return {
    devices: sortedDevices,
    startScan,
    stopScan,
    isScanning,
    sortBy,
    setSortBy,
    filterBySignal
  };
};
```

**Usage:**

```typescript
const DeviceScanner = () => {
  const {
    devices,
    startScan,
    isScanning,
    sortBy,
    setSortBy,
    filterBySignal
  } = useDeviceList();

  // Only show devices with good signal
  const strongDevices = filterBySignal(-75);

  return (
    <View>
      <Button
        title={isScanning ? 'Scanning...' : 'Scan'}
        onPress={() => startScan(15000)}
      />
      
      <View style={{ flexDirection: 'row' }}>
        <Button
          title="Sort by Signal"
          onPress={() => setSortBy('rssi')}
        />
        <Button
          title="Sort by Name"
          onPress={() => setSortBy('name')}
        />
      </View>

      {strongDevices.map(device => (
        <DeviceItem key={device.id} device={device} />
      ))}
    </View>
  );
};
```

### useBuzzerControl - Enhanced Buzzer Control

```typescript
// hooks/useBuzzerControl.ts
import { useCallback } from 'react';
import { useBuzzer } from '@kgiton/react-native-sdk';
import { Alert } from 'react-native';

type BuzzerCommand = 'BEEP' | 'BUZZ' | 'LONG' | 'TARE';

export const useBuzzerControl = () => {
  const { triggerBuzzer } = useBuzzer();

  const beep = useCallback(async () => {
    try {
      await triggerBuzzer('BEEP');
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  }, [triggerBuzzer]);

  const buzz = useCallback(async () => {
    try {
      await triggerBuzzer('BUZZ');
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  }, [triggerBuzzer]);

  const longBeep = useCallback(async () => {
    try {
      await triggerBuzzer('LONG');
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  }, [triggerBuzzer]);

  const tare = useCallback(async () => {
    try {
      await triggerBuzzer('TARE');
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  }, [triggerBuzzer]);

  const playSequence = useCallback(async (commands: BuzzerCommand[]) => {
    for (const command of commands) {
      await triggerBuzzer(command);
      await new Promise(resolve => setTimeout(resolve, 500)); // Delay between commands
    }
  }, [triggerBuzzer]);

  return {
    beep,
    buzz,
    longBeep,
    tare,
    playSequence
  };
};
```

**Usage:**

```typescript
const BuzzerControls = () => {
  const { beep, buzz, longBeep, playSequence } = useBuzzerControl();

  const playMelody = () => {
    playSequence(['BEEP', 'BEEP', 'BUZZ', 'LONG']);
  };

  return (
    <View>
      <Button title="Beep" onPress={beep} />
      <Button title="Buzz" onPress={buzz} />
      <Button title="Long Beep" onPress={longBeep} />
      <Button title="Play Melody" onPress={playMelody} />
    </View>
  );
};
```

---

## Advanced Patterns

### useAutoReconnect - Automatic Reconnection

```typescript
// hooks/useAutoReconnect.ts
import { useEffect, useRef } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

export const useAutoReconnect = (
  deviceId?: string,
  licenseKey?: string,
  maxAttempts = 5
) => {
  const { connect, connectionState } = useKGiTONScale();
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (
      connectionState === 'disconnected' &&
      deviceId &&
      licenseKey &&
      attemptsRef.current < maxAttempts
    ) {
      const timer = setTimeout(async () => {
        console.log(`Reconnection attempt ${attemptsRef.current + 1}/${maxAttempts}`);
        attemptsRef.current++;
        
        try {
          await connect(deviceId, licenseKey);
          attemptsRef.current = 0; // Reset on success
        } catch (error) {
          console.error('Reconnection failed:', error);
        }
      }, 2000 * attemptsRef.current); // Exponential backoff

      return () => clearTimeout(timer);
    }
  }, [connectionState, deviceId, licenseKey, maxAttempts, connect]);

  const resetAttempts = () => {
    attemptsRef.current = 0;
  };

  return {
    attempts: attemptsRef.current,
    resetAttempts
  };
};
```

### usePersistentConnection - Connection with Storage

```typescript
// hooks/usePersistentConnection.ts
import { useEffect, useState } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LAST_DEVICE_KEY = '@last_device';

export const usePersistentConnection = () => {
  const { connect, disconnect, isConnected } = useKGiTONScale();
  const [lastDevice, setLastDevice] = useState<{
    deviceId: string;
    licenseKey: string;
  } | null>(null);

  useEffect(() => {
    loadLastDevice();
  }, []);

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

  const connectAndSave = async (deviceId: string, licenseKey: string) => {
    const response = await connect(deviceId, licenseKey);
    
    if (response.success) {
      const deviceData = { deviceId, licenseKey };
      await AsyncStorage.setItem(LAST_DEVICE_KEY, JSON.stringify(deviceData));
      setLastDevice(deviceData);
    }
    
    return response;
  };

  const reconnectToLast = async () => {
    if (lastDevice) {
      return await connect(lastDevice.deviceId, lastDevice.licenseKey);
    }
    throw new Error('No previous device found');
  };

  const disconnectAndClear = async () => {
    await disconnect();
    await AsyncStorage.removeItem(LAST_DEVICE_KEY);
    setLastDevice(null);
  };

  return {
    connectAndSave,
    reconnectToLast,
    disconnectAndClear,
    lastDevice,
    isConnected
  };
};
```

**Usage:**

```typescript
const QuickConnect = () => {
  const {
    connectAndSave,
    reconnectToLast,
    lastDevice,
    isConnected
  } = usePersistentConnection();

  return (
    <View>
      {lastDevice && !isConnected && (
        <Button
          title={`Reconnect to ${lastDevice.deviceId}`}
          onPress={reconnectToLast}
        />
      )}
    </View>
  );
};
```

---

## Complete Example: Hooks-Based App

```typescript
// App.tsx
import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator
} from 'react-native';
import { ScaleDevice } from '@kgiton/react-native-sdk';
import { useDeviceList } from './hooks/useDeviceList';
import { useScaleConnection } from './hooks/useScaleConnection';
import { useWeightTracking } from './hooks/useWeightTracking';
import { useBuzzerControl } from './hooks/useBuzzerControl';
import { usePersistentConnection } from './hooks/usePersistentConnection';
import { useAutoReconnect } from './hooks/useAutoReconnect';

const App = () => {
  const {
    devices,
    startScan,
    isScanning,
    sortBy,
    setSortBy
  } = useDeviceList();

  const {
    connectAndSave,
    reconnectToLast,
    disconnectAndClear,
    lastDevice,
    isConnected
  } = usePersistentConnection();

  const { loading } = useScaleConnection();

  const {
    current: currentWeight,
    statistics,
    clearHistory
  } = useWeightTracking();

  const { beep, buzz, longBeep } = useBuzzerControl();

  // Auto-reconnect to last device
  useAutoReconnect(
    lastDevice?.deviceId,
    lastDevice?.licenseKey,
    3 // Max 3 attempts
  );

  const handleConnect = async (device: ScaleDevice) => {
    const licenseKey = 'ABCDE-12345-FGHIJ-67890-KLMNO';
    
    try {
      const response = await connectAndSave(device.id, licenseKey);
      
      if (!response.success) {
        Alert.alert('Connection Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const renderDevice = ({ item }: { item: ScaleDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
      </View>
      <Button title="Connect" onPress={() => handleConnect(item)} />
    </View>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Connecting...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>KGiTON Scale</Text>
      </View>

      {!isConnected ? (
        <View style={styles.content}>
          {lastDevice && (
            <Button
              title="Reconnect to Last Device"
              onPress={reconnectToLast}
            />
          )}

          <Button
            title={isScanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={() => startScan(15000)}
            disabled={isScanning}
          />

          <View style={styles.sortButtons}>
            <Button
              title="Sort by Signal"
              onPress={() => setSortBy('rssi')}
            />
            <Button
              title="Sort by Name"
              onPress={() => setSortBy('name')}
            />
          </View>

          <FlatList
            data={devices}
            renderItem={renderDevice}
            keyExtractor={(item) => item.id}
            style={styles.deviceList}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                {isScanning ? 'Scanning...' : 'No devices found'}
              </Text>
            }
          />
        </View>
      ) : (
        <View style={styles.content}>
          <View style={styles.weightCard}>
            <Text style={styles.weightLabel}>Current Weight</Text>
            <Text style={styles.weight}>
              {currentWeight ? currentWeight.weight.toFixed(3) : '---.-'}
            </Text>
            <Text style={styles.unit}>{currentWeight?.unit || 'kg'}</Text>
          </View>

          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Statistics</Text>
            <Text>Average: {statistics.average.toFixed(3)} kg</Text>
            <Text>Min: {statistics.min.toFixed(3)} kg</Text>
            <Text>Max: {statistics.max.toFixed(3)} kg</Text>
            <Text>Count: {statistics.count}</Text>
            <Button title="Clear History" onPress={clearHistory} />
          </View>

          <View style={styles.controls}>
            <Button title="Beep" onPress={beep} />
            <Button title="Buzz" onPress={buzz} />
            <Button title="Long" onPress={longBeep} />
          </View>

          <Button
            title="Disconnect"
            onPress={disconnectAndClear}
            color="red"
          />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  content: {
    flex: 1,
    padding: 20
  },
  sortButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 10
  },
  deviceList: {
    marginTop: 20
  },
  deviceCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 10
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
  },
  weightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    marginBottom: 20
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
  statsCard: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 20
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666'
  }
});

export default App;
```

---

## Best Practices

### 1. Use Custom Hooks for Logic Reuse

```typescript
// ✅ GOOD - Reusable custom hook
const useWeightValidation = (weight: WeightData | null) => {
  return useMemo(() => {
    if (!weight) return { valid: false, message: 'No weight data' };
    if (weight.weight < 0) return { valid: false, message: 'Negative weight' };
    if (weight.weight > 500) return { valid: false, message: 'Weight too high' };
    return { valid: true, message: 'Valid' };
  }, [weight]);
};

// ❌ BAD - Logic in component
const Component = () => {
  const { weight } = useKGiTONScale();
  
  // Repeated validation logic in component
  const isValid = weight && weight.weight >= 0 && weight.weight <= 500;
  
  return <View />;
};
```

### 2. Combine Multiple Hooks

```typescript
const useScaleFeatures = () => {
  const connection = useScaleConnection();
  const tracking = useWeightTracking();
  const buzzer = useBuzzerControl();

  return {
    ...connection,
    ...tracking,
    ...buzzer
  };
};
```

### 3. Memoize Expensive Computations

```typescript
const { weight } = useKGiTONScale();

const processedWeight = useMemo(() => {
  if (!weight) return null;
  
  // Expensive calculation
  return {
    kg: weight.weight,
    lb: weight.weight * 2.20462,
    oz: weight.weight * 35.274
  };
}, [weight]);
```

---

## See Also

- [API Hooks Reference](./09-api-hooks.md)
- [Context Integration Guide](./17-context-integration.md)
- [Basic Integration Guide](./15-basic-integration.md)
- [Performance Guide](./13-performance.md)
