# Quick Start Guide

Get up and running with the KGiTON React Native SDK in just a few minutes.

## Basic Usage

### 1. Import the SDK

```typescript
import React, { useState, useEffect } from 'react';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
} from '@kgiton/react-native-sdk';
```

### 2. Create Service Instance

```typescript
const App = () => {
  // Create service instance (pass true to enable logging)
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [state, setState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );

  // ... rest of your component
};
```

### 3. Setup Event Handlers

```typescript
useEffect(() => {
  // Setup event handlers
  service.setEventHandlers({
    onWeightData: (data) => {
      console.log('Weight:', data.weight, 'kg');
      setWeight(data);
    },
    onConnectionStateChange: (newState) => {
      console.log('Connection state:', newState);
      setState(newState);
    },
    onDevicesFound: (foundDevices) => {
      console.log('Found devices:', foundDevices.length);
      setDevices(foundDevices);
    },
    onError: (error) => {
      console.error('Error:', error.message);
    },
  });

  // Cleanup on unmount
  return () => {
    service.dispose();
  };
}, [service]);
```

### 4. Request Permissions (Android)

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    const allGranted = Object.values(granted).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );

    return allGranted;
  }
  return true; // iOS handles permissions automatically
};
```

### 5. Scan for Devices

```typescript
const scanForDevices = async () => {
  try {
    // Check Bluetooth is enabled
    const isEnabled = await service.isBluetoothEnabled();
    if (!isEnabled) {
      console.log('Please enable Bluetooth');
      return;
    }

    // Start scanning (15 seconds timeout)
    await service.scanForDevices(15000);
  } catch (error) {
    console.error('Scan error:', error);
  }
};
```

### 6. Connect to Device

```typescript
const connectToDevice = async (deviceId: string, licenseKey: string) => {
  try {
    const response = await service.connectWithLicenseKey(deviceId, licenseKey);
    console.log('Connected:', response.message);
  } catch (error) {
    console.error('Connection error:', error);
  }
};
```

### 7. Receive Weight Data

Once connected and authenticated, weight data will be received automatically:

```typescript
service.setEventHandlers({
  onWeightData: (data: WeightData) => {
    console.log('Weight:', data.weight, 'kg');
    console.log('Timestamp:', new Date(data.timestamp));
    console.log('Device ID:', data.deviceId);
  },
});
```

### 8. Control Buzzer

```typescript
const triggerBuzzer = async (command: string) => {
  try {
    await service.triggerBuzzer(command); // 'BEEP', 'BUZZ', 'LONG', 'OFF'
    console.log('Buzzer triggered:', command);
  } catch (error) {
    console.error('Buzzer error:', error);
  }
};
```

### 9. Disconnect

```typescript
const disconnect = async () => {
  try {
    await service.disconnect();
    console.log('Disconnected successfully');
  } catch (error) {
    console.error('Disconnect error:', error);
  }
};
```

## Complete Example

Here's a complete minimal example:

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button, FlatList, Alert } from 'react-native';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
} from '@kgiton/react-native-sdk';

const App = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [state, setState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );

  useEffect(() => {
    service.setEventHandlers({
      onWeightData: setWeight,
      onConnectionStateChange: setState,
      onDevicesFound: setDevices,
      onError: (error) => Alert.alert('Error', error.message),
    });

    return () => service.dispose();
  }, [service]);

  const handleScan = async () => {
    const isEnabled = await service.isBluetoothEnabled();
    if (!isEnabled) {
      Alert.alert('Bluetooth', 'Please enable Bluetooth');
      return;
    }
    await service.scanForDevices(15000);
  };

  const handleConnect = (deviceId: string) => {
    Alert.prompt(
      'License Key',
      'Enter your device license key',
      async (licenseKey) => {
        try {
          await service.connectWithLicenseKey(deviceId, licenseKey);
        } catch (error: any) {
          Alert.alert('Error', error.message);
        }
      }
    );
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        KGiTON Scale
      </Text>
      <Text>Status: {state}</Text>
      
      {service.isAuthenticated() && (
        <Text style={{ fontSize: 48 }}>
          {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
        </Text>
      )}

      {!service.isConnected() && (
        <>
          <Button title="Scan Devices" onPress={handleScan} />
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={{ padding: 10 }}>
                <Text>{item.name}</Text>
                <Button
                  title="Connect"
                  onPress={() => handleConnect(item.id)}
                />
              </View>
            )}
          />
        </>
      )}

      {service.isConnected() && (
        <Button
          title="Disconnect"
          onPress={() => service.disconnect()}
        />
      )}
    </View>
  );
};

export default App;
```

## Next Steps

- Learn about [Architecture](./04-architecture.md)
- Explore [API Reference](./07-api-service.md)
- Check out [Full Examples](../example/)
- Setup [Permissions](./18-permissions.md) properly

## Common Patterns

### Check Connection Status

```typescript
if (service.isConnected()) {
  console.log('Connected to:', service.getConnectedDevice()?.name);
}

if (service.isAuthenticated()) {
  console.log('Device is authenticated and ready');
}
```

### Get Current State

```typescript
const currentState = service.getConnectionState();
console.log('Current state:', currentState);
```

### Stop Scanning

```typescript
service.stopScan();
```

### Get Available Devices

```typescript
const devices = service.getAvailableDevices();
console.log('Found devices:', devices);
```

## Tips

1. **Always check Bluetooth is enabled** before scanning
2. **Request permissions** before attempting to scan (Android)
3. **Use event handlers** for reactive updates
4. **Cleanup properly** by calling `dispose()` when unmounting
5. **Handle errors** in all async operations
6. **Store license keys securely** - SDK handles this automatically

## Troubleshooting

**No devices found during scan:**
- Ensure Bluetooth is enabled
- Check permissions are granted
- Ensure scale device is powered on and in range
- Try increasing scan timeout

**Cannot connect to device:**
- Verify license key is correct
- Ensure device is not connected to another app
- Check device battery level

**Weight data not received:**
- Ensure device is authenticated (not just connected)
- Check BLE characteristics are properly subscribed
- Verify scale is functioning and sending data

For more detailed troubleshooting, see [Troubleshooting Guide](./19-troubleshooting.md).
