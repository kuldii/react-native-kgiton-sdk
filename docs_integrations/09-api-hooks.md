# React Hooks API Reference

Complete reference for all React Hooks provided by the KGiTON SDK.

## Overview

The SDK provides pre-built React Hooks for easy integration into functional components. These hooks handle state management, side effects, and cleanup automatically.

## Installation

Hooks are included in the main SDK package:

```typescript
import { useKGiTONScale, useWeight, useDeviceScan } from '@kgiton/react-native-sdk';
```

---

## useKGiTONScale

All-in-one hook that provides complete scale functionality.

### Signature

```typescript
function useKGiTONScale(config?: UseKGiTONScaleConfig): UseKGiTONScaleReturn
```

### Parameters

```typescript
interface UseKGiTONScaleConfig {
  enableLogging?: boolean;          // Enable SDK logging
  autoDispose?: boolean;             // Auto cleanup on unmount (default: true)
}
```

### Return Value

```typescript
interface UseKGiTONScaleReturn {
  // Service instance
  service: KGiTONScaleService;
  
  // State
  devices: ScaleDevice[];
  weight: WeightData | null;
  connectionState: ScaleConnectionState;
  isScanning: boolean;
  error: Error | null;
  
  // Actions
  scan: (timeout?: number) => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string, licenseKey: string) => Promise<ControlResponse>;
  disconnect: () => Promise<void>;
  triggerBuzzer: (command: string) => Promise<void>;
  
  // Utilities
  isConnected: boolean;
  isAuthenticated: boolean;
  connectedDevice: ScaleDevice | null;
}
```

### Example

```typescript
import React from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const ScaleApp = () => {
  const {
    devices,
    weight,
    connectionState,
    isAuthenticated,
    scan,
    connect,
    disconnect,
    triggerBuzzer
  } = useKGiTONScale({ enableLogging: true });

  const handleConnect = async (deviceId: string) => {
    try {
      await connect(deviceId, 'YOUR-LICENSE-KEY');
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View>
      <Text>State: {connectionState}</Text>
      
      {weight && (
        <Text>Weight: {weight.weight.toFixed(3)} kg</Text>
      )}
      
      {!isAuthenticated ? (
        <>
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
        </>
      ) : (
        <>
          <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
          <Button title="Disconnect" onPress={disconnect} />
        </>
      )}
    </View>
  );
};
```

---

## useDeviceScan

Hook for scanning BLE devices.

### Signature

```typescript
function useDeviceScan(
  service: KGiTONScaleService,
  autoStart?: boolean
): UseDeviceScanReturn
```

### Parameters

- `service`: KGiTONScaleService instance
- `autoStart` (optional): Start scanning on mount (default: false)

### Return Value

```typescript
interface UseDeviceScanReturn {
  devices: ScaleDevice[];
  isScanning: boolean;
  error: Error | null;
  scan: (timeout?: number) => Promise<void>;
  stopScan: () => void;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, Button, FlatList, Text } from 'react-native';
import { KGiTONScaleService, useDeviceScan } from '@kgiton/react-native-sdk';

const DeviceScanner = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const { devices, isScanning, scan, stopScan } = useDeviceScan(service);

  return (
    <View>
      <Button
        title={isScanning ? 'Stop Scan' : 'Start Scan'}
        onPress={isScanning ? stopScan : () => scan(15000)}
      />
      
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>Signal: {item.rssi} dBm</Text>
          </View>
        )}
      />
    </View>
  );
};
```

---

## useDeviceConnection

Hook for managing device connection.

### Signature

```typescript
function useDeviceConnection(
  service: KGiTONScaleService
): UseDeviceConnectionReturn
```

### Parameters

- `service`: KGiTONScaleService instance

### Return Value

```typescript
interface UseDeviceConnectionReturn {
  connectionState: ScaleConnectionState;
  connectedDevice: ScaleDevice | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: Error | null;
  connect: (deviceId: string, licenseKey: string) => Promise<ControlResponse>;
  disconnect: () => Promise<void>;
  disconnectWithKey: (licenseKey: string) => Promise<ControlResponse>;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { 
  KGiTONScaleService, 
  useDeviceConnection 
} from '@kgiton/react-native-sdk';

const ConnectionManager = ({ deviceId, licenseKey }) => {
  const [service] = useState(() => new KGiTONScaleService());
  const {
    connectionState,
    connectedDevice,
    isAuthenticated,
    connect,
    disconnect
  } = useDeviceConnection(service);

  const handleConnect = async () => {
    try {
      const response = await connect(deviceId, licenseKey);
      Alert.alert('Success', response.message);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <View>
      <Text>State: {connectionState}</Text>
      
      {connectedDevice && (
        <Text>Device: {connectedDevice.name}</Text>
      )}
      
      {!isAuthenticated ? (
        <Button title="Connect" onPress={handleConnect} />
      ) : (
        <Button title="Disconnect" onPress={disconnect} />
      )}
    </View>
  );
};
```

---

## useWeight

Hook for receiving weight data.

### Signature

```typescript
function useWeight(
  service: KGiTONScaleService,
  options?: UseWeightOptions
): UseWeightReturn
```

### Parameters

```typescript
interface UseWeightOptions {
  onWeightChange?: (data: WeightData) => void;
  enableHistory?: boolean;
  historySize?: number;
}
```

- `service`: KGiTONScaleService instance
- `options` (optional): Configuration options

### Return Value

```typescript
interface UseWeightReturn {
  weight: WeightData | null;
  history: WeightData[];
  average: number;
  min: number;
  max: number;
  clearHistory: () => void;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, Text, Button } from 'react-native';
import { KGiTONScaleService, useWeight } from '@kgiton/react-native-sdk';

const WeightDisplay = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const {
    weight,
    history,
    average,
    min,
    max,
    clearHistory
  } = useWeight(service, {
    enableHistory: true,
    historySize: 10,
    onWeightChange: (data) => console.log('New weight:', data.weight)
  });

  return (
    <View>
      <Text style={{ fontSize: 48 }}>
        {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
      </Text>
      
      {history.length > 0 && (
        <>
          <Text>Samples: {history.length}</Text>
          <Text>Average: {average.toFixed(3)} kg</Text>
          <Text>Min: {min.toFixed(3)} kg</Text>
          <Text>Max: {max.toFixed(3)} kg</Text>
          <Button title="Clear History" onPress={clearHistory} />
        </>
      )}
    </View>
  );
};
```

---

## useBuzzer

Hook for controlling device buzzer.

### Signature

```typescript
function useBuzzer(
  service: KGiTONScaleService
): UseBuzzerReturn
```

### Parameters

- `service`: KGiTONScaleService instance

### Return Value

```typescript
interface UseBuzzerReturn {
  trigger: (command: string) => Promise<void>;
  isTriggering: boolean;
  error: Error | null;
  beep: () => Promise<void>;
  buzz: () => Promise<void>;
  long: () => Promise<void>;
  off: () => Promise<void>;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, Button } from 'react-native';
import { KGiTONScaleService, useBuzzer } from '@kgiton/react-native-sdk';

const BuzzerControls = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const { beep, buzz, long, off, isTriggering } = useBuzzer(service);

  return (
    <View>
      <Button
        title="Beep"
        onPress={beep}
        disabled={isTriggering}
      />
      <Button
        title="Buzz"
        onPress={buzz}
        disabled={isTriggering}
      />
      <Button
        title="Long Beep"
        onPress={long}
        disabled={isTriggering}
      />
      <Button
        title="Off"
        onPress={off}
        disabled={isTriggering}
      />
    </View>
  );
};
```

---

## useConnectionState

Hook for monitoring connection state.

### Signature

```typescript
function useConnectionState(
  service: KGiTONScaleService
): UseConnectionStateReturn
```

### Parameters

- `service`: KGiTONScaleService instance

### Return Value

```typescript
interface UseConnectionStateReturn {
  state: ScaleConnectionState;
  isConnected: boolean;
  isAuthenticated: boolean;
  isScanning: boolean;
  isConnecting: boolean;
  stateColor: string;
  stateIcon: string;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { KGiTONScaleService, useConnectionState } from '@kgiton/react-native-sdk';

const StatusIndicator = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const {
    state,
    isAuthenticated,
    stateColor,
    stateIcon
  } = useConnectionState(service);

  return (
    <View style={{ backgroundColor: stateColor, padding: 10 }}>
      <Text>{stateIcon} {state}</Text>
      {isAuthenticated && <Text>✓ Ready for data</Text>}
    </View>
  );
};
```

---

## useDeviceList

Hook for managing device list with filtering and sorting.

### Signature

```typescript
function useDeviceList(
  service: KGiTONScaleService,
  options?: UseDeviceListOptions
): UseDeviceListReturn
```

### Parameters

```typescript
interface UseDeviceListOptions {
  minRSSI?: number;              // Minimum signal strength
  sortBy?: 'rssi' | 'name';      // Sort order
  filterByLicense?: boolean;      // Show only devices with stored license
}
```

### Return Value

```typescript
interface UseDeviceListReturn {
  devices: ScaleDevice[];
  filteredDevices: ScaleDevice[];
  devicesWithLicense: ScaleDevice[];
  goodSignalDevices: ScaleDevice[];
  setFilter: (filter: string) => void;
}
```

### Example

```typescript
import React, { useState } from 'react';
import { View, TextInput, FlatList, Text } from 'react-native';
import { KGiTONScaleService, useDeviceList } from '@kgiton/react-native-sdk';

const DeviceList = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const {
    filteredDevices,
    goodSignalDevices,
    setFilter
  } = useDeviceList(service, {
    minRSSI: -85,
    sortBy: 'rssi'
  });

  return (
    <View>
      <TextInput
        placeholder="Search devices..."
        onChangeText={setFilter}
      />
      
      <Text>Good Signal: {goodSignalDevices.length}</Text>
      
      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View>
            <Text>{item.name}</Text>
            <Text>{item.rssi} dBm</Text>
          </View>
        )}
      />
    </View>
  );
};
```

---

## Custom Hook Examples

### useAutoConnect

Automatically connect to a known device.

```typescript
import { useEffect } from 'react';
import { KGiTONScaleService, useDeviceConnection } from '@kgiton/react-native-sdk';

function useAutoConnect(
  service: KGiTONScaleService,
  deviceId: string,
  licenseKey: string,
  enabled: boolean = true
) {
  const { connect, isConnected } = useDeviceConnection(service);

  useEffect(() => {
    if (enabled && !isConnected) {
      connect(deviceId, licenseKey).catch(console.error);
    }
  }, [enabled, isConnected, deviceId, licenseKey]);

  return { isConnected };
}

// Usage
const { isConnected } = useAutoConnect(service, 'DEVICE_ID', 'LICENSE', true);
```

### useWeightStats

Calculate weight statistics in real-time.

```typescript
import { useState, useEffect } from 'react';
import { KGiTONScaleService, WeightData } from '@kgiton/react-native-sdk';

function useWeightStats(service: KGiTONScaleService) {
  const [weights, setWeights] = useState<number[]>([]);

  useEffect(() => {
    service.setEventHandlers({
      onWeightData: (data: WeightData) => {
        setWeights(prev => [...prev.slice(-99), data.weight]);
      }
    });
  }, [service]);

  const stats = {
    count: weights.length,
    average: weights.reduce((a, b) => a + b, 0) / weights.length || 0,
    min: Math.min(...weights) || 0,
    max: Math.max(...weights) || 0,
    latest: weights[weights.length - 1] || 0
  };

  return stats;
}

// Usage
const stats = useWeightStats(service);
console.log(`Avg: ${stats.average.toFixed(3)} kg`);
```

### useStableConnection

Monitor connection stability.

```typescript
import { useState, useEffect } from 'react';
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

function useStableConnection(service: KGiTONScaleService) {
  const [isStable, setIsStable] = useState(true);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);

  useEffect(() => {
    service.setEventHandlers({
      onConnectionStateChange: (state) => {
        if (state === 'ERROR' || state === 'DISCONNECTED') {
          setIsStable(false);
          setReconnectAttempts(prev => prev + 1);
        } else if (state === 'AUTHENTICATED') {
          setIsStable(true);
        }
      }
    });
  }, [service]);

  return { isStable, reconnectAttempts };
}

// Usage
const { isStable, reconnectAttempts } = useStableConnection(service);
```

---

## Hook Best Practices

### 1. Service Instance Management

```typescript
// ✅ GOOD - Single instance
const [service] = useState(() => new KGiTONScaleService());

// ❌ BAD - New instance on every render
const service = new KGiTONScaleService();
```

### 2. Cleanup

```typescript
// ✅ GOOD - Cleanup in useEffect
useEffect(() => {
  const service = new KGiTONScaleService();
  
  return () => {
    service.dispose();
  };
}, []);
```

### 3. Event Handler Dependencies

```typescript
// ✅ GOOD - Stable callback
const handleWeight = useCallback((data: WeightData) => {
  console.log(data.weight);
}, []);

useEffect(() => {
  service.setEventHandlers({ onWeightData: handleWeight });
}, [service, handleWeight]);
```

### 4. Conditional Operations

```typescript
// ✅ GOOD - Check state before operation
const handleBuzzer = async () => {
  if (isAuthenticated) {
    await service.triggerBuzzer('BEEP');
  } else {
    Alert.alert('Not connected');
  }
};
```

---

## Complete Example with Multiple Hooks

```typescript
import React, { useState } from 'react';
import { View, Text, Button, FlatList, StyleSheet } from 'react-native';
import {
  KGiTONScaleService,
  useDeviceScan,
  useDeviceConnection,
  useWeight,
  useBuzzer
} from '@kgiton/react-native-sdk';

const CompleteScaleApp = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  
  // Use hooks
  const { devices, isScanning, scan } = useDeviceScan(service);
  const { isAuthenticated, connect, disconnect } = useDeviceConnection(service);
  const { weight, history, average } = useWeight(service, { enableHistory: true });
  const { beep, buzz } = useBuzzer(service);

  const handleConnect = async (deviceId: string) => {
    try {
      await connect(deviceId, 'YOUR-LICENSE-KEY');
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>KGiTON Scale</Text>
      
      {!isAuthenticated ? (
        <>
          <Button
            title={isScanning ? 'Scanning...' : 'Scan Devices'}
            onPress={() => scan(15000)}
            disabled={isScanning}
          />
          
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Button
                title={`${item.name} (${item.rssi} dBm)`}
                onPress={() => handleConnect(item.id)}
              />
            )}
          />
        </>
      ) : (
        <>
          <Text style={styles.weight}>
            {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
          </Text>
          
          {history.length > 0 && (
            <Text>Average: {average.toFixed(3)} kg ({history.length} samples)</Text>
          )}
          
          <View style={styles.controls}>
            <Button title="Beep" onPress={beep} />
            <Button title="Buzz" onPress={buzz} />
            <Button title="Disconnect" onPress={disconnect} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  weight: { fontSize: 48, textAlign: 'center', marginVertical: 20 },
  controls: { flexDirection: 'row', justifyContent: 'space-around' }
});

export default CompleteScaleApp;
```

---

## See Also

- [Service API Reference](./07-api-service.md)
- [Context API](./10-api-context.md)
- [Hooks Integration Guide](./16-hooks-integration.md)
