# Basic Integration Guide

Step-by-step guide to integrate the KGiTON SDK into your React Native application.

## Overview

This guide walks you through the complete integration process, from installation to implementing basic scale functionality.

---

## Prerequisites

Before starting, ensure you have:

- ✅ React Native project (0.70+)
- ✅ Node.js 18+ and npm/yarn
- ✅ Physical Android/iOS device (BLE testing requires real hardware)
- ✅ KGiTON scale device
- ✅ Valid license key

---

## Step 1: Installation

### Install the SDK

```bash
npm install @kgiton/react-native-sdk
# or
yarn add @kgiton/react-native-sdk
```

### Install Peer Dependencies

```bash
npm install react-native-ble-plx @react-native-async-storage/async-storage
# or
yarn add react-native-ble-plx @react-native-async-storage/async-storage
```

### iOS Setup

```bash
cd ios && pod install && cd ..
```

---

## Step 2: Platform Configuration

### Android Permissions

Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
  
  <!-- Bluetooth Permissions for Android 12+ -->
  <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                   android:usesPermissionFlags="neverForLocation" />
  <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
  
  <!-- Bluetooth Permissions for Android 11 and below -->
  <uses-permission android:name="android.permission.BLUETOOTH" />
  <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
  
  <!-- Location Permission (required for BLE scan on Android < 12) -->
  <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
  
  <application>
    <!-- Your app config -->
  </application>
  
</manifest>
```

### iOS Permissions

Add to `ios/YourApp/Info.plist`:

```xml
<dict>
  <!-- ... other keys ... -->
  
  <key>NSBluetoothAlwaysUsageDescription</key>
  <string>This app needs Bluetooth to connect to scale devices</string>
  
  <key>NSBluetoothPeripheralUsageDescription</key>
  <string>This app needs Bluetooth to communicate with scale devices</string>
  
</dict>
```

---

## Step 3: Request Permissions

Create a permission utility:

```typescript
// utils/permissions.ts
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export const requestBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    // iOS permissions are handled via Info.plist
    return true;
  }

  if (Platform.OS === 'android') {
    if (Platform.Version >= 31) {
      // Android 12+
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      return (
        granted['android.permission.BLUETOOTH_SCAN'] === 'granted' &&
        granted['android.permission.BLUETOOTH_CONNECT'] === 'granted'
      );
    } else {
      // Android 11 and below
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: 'Bluetooth scanning requires location permission',
          buttonPositive: 'OK',
        }
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }

  return false;
};

export const openAppSettings = () => {
  Linking.openSettings();
};
```

---

## Step 4: Initialize the Service

### Method A: Using Service Directly

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { KGiTONScaleService, ScaleDevice, WeightData } from '@kgiton/react-native-sdk';
import { requestBluetoothPermission } from './utils/permissions';

const App = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Setup event listeners
    service.on('weight', (data) => {
      setWeight(data);
    });

    service.on('connected', () => {
      setIsConnected(true);
      Alert.alert('Success', 'Connected to scale');
    });

    service.on('disconnected', () => {
      setIsConnected(false);
      setWeight(null);
      Alert.alert('Info', 'Disconnected from scale');
    });

    service.on('error', (error) => {
      Alert.alert('Error', error.message);
    });

    // Cleanup
    return () => {
      service.dispose();
    };
  }, [service]);

  const handleScan = async () => {
    try {
      // Request permission
      const hasPermission = await requestBluetoothPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Bluetooth permission is required');
        return;
      }

      setIsScanning(true);
      const foundDevices = await service.scanForDevices(15000);
      setDevices(foundDevices);
      setIsScanning(false);

      if (foundDevices.length === 0) {
        Alert.alert('No Devices', 'No scales found nearby');
      }
    } catch (error: any) {
      setIsScanning(false);
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleConnect = async (device: ScaleDevice) => {
    try {
      const licenseKey = 'ABCDE-12345-FGHIJ-67890-KLMNO'; // Your license key
      
      const response = await service.connectWithLicenseKey(
        device.id,
        licenseKey
      );

      if (!response.success) {
        Alert.alert('Connection Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await service.disconnect();
    } catch (error: any) {
      Alert.alert('Disconnection Error', error.message);
    }
  };

  const handleBuzzer = async () => {
    try {
      await service.triggerBuzzer('BEEP');
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>KGiTON Scale</Text>

      {!isConnected ? (
        <>
          <Button
            title={isScanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={handleScan}
            disabled={isScanning}
          />

          {devices.map((device) => (
            <View key={device.id} style={{ marginTop: 10 }}>
              <Text>{device.name}</Text>
              <Text>RSSI: {device.rssi} dBm</Text>
              <Button
                title="Connect"
                onPress={() => handleConnect(device)}
              />
            </View>
          ))}
        </>
      ) : (
        <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>
            {weight ? `${weight.weight.toFixed(3)} ${weight.unit}` : '---.--- kg'}
          </Text>

          <View style={{ marginTop: 20 }}>
            <Button title="Beep" onPress={handleBuzzer} />
          </View>

          <View style={{ marginTop: 10 }}>
            <Button
              title="Disconnect"
              onPress={handleDisconnect}
              color="red"
            />
          </View>
        </>
      )}
    </View>
  );
};

export default App;
```

### Method B: Using Hooks

```typescript
// App.tsx
import React, { useEffect } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import { useKGiTONScale } from '@kgiton/react-native-sdk';
import { requestBluetoothPermission } from './utils/permissions';

const App = () => {
  const {
    devices,
    weight,
    isScanning,
    isConnected,
    scan,
    connect,
    disconnect,
    triggerBuzzer,
  } = useKGiTONScale();

  const handleScan = async () => {
    const hasPermission = await requestBluetoothPermission();
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Bluetooth permission is required');
      return;
    }

    await scan(15000);

    if (devices.length === 0) {
      Alert.alert('No Devices', 'No scales found nearby');
    }
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const licenseKey = 'ABCDE-12345-FGHIJ-67890-KLMNO';
      const response = await connect(deviceId, licenseKey);

      if (!response.success) {
        Alert.alert('Connection Failed', response.message);
      }
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>KGiTON Scale</Text>

      {!isConnected ? (
        <>
          <Button
            title={isScanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={handleScan}
            disabled={isScanning}
          />

          {devices.map((device) => (
            <View key={device.id} style={{ marginTop: 10 }}>
              <Text>{device.name}</Text>
              <Button
                title="Connect"
                onPress={() => handleConnect(device.id)}
              />
            </View>
          ))}
        </>
      ) : (
        <>
          <Text style={{ fontSize: 48, textAlign: 'center' }}>
            {weight ? `${weight.weight.toFixed(3)} ${weight.unit}` : '---.--- kg'}
          </Text>

          <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
          <Button title="Disconnect" onPress={disconnect} color="red" />
        </>
      )}
    </View>
  );
};

export default App;
```

---

## Step 5: Test the Integration

### Run on Android

```bash
npm run android
```

### Run on iOS

```bash
npm run ios
```

### Testing Checklist

- [ ] App builds successfully
- [ ] Bluetooth permission requested
- [ ] Scan finds devices
- [ ] Connection successful
- [ ] Weight data displayed
- [ ] Buzzer works
- [ ] Disconnect works
- [ ] No errors in console

---

## Step 6: Handle Edge Cases

### Add Error Boundaries

```typescript
// components/ErrorBoundary.tsx
import React, { Component, ReactNode } from 'react';
import { View, Text, Button } from 'react-native';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
          <Text style={{ fontSize: 18, marginBottom: 10 }}>
            Something went wrong
          </Text>
          <Text style={{ marginBottom: 20 }}>
            {this.state.error?.message}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

### Use Error Boundary

```typescript
// App.tsx
import ErrorBoundary from './components/ErrorBoundary';

const Root = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default Root;
```

### Add Loading States

```typescript
const App = () => {
  const [loading, setLoading] = useState(false);

  const handleConnect = async (deviceId: string) => {
    setLoading(true);
    try {
      await connect(deviceId, licenseKey);
    } catch (error) {
      // Handle error
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
        <Text>Connecting...</Text>
      </View>
    );
  }

  return (
    // ... rest of component
  );
};
```

---

## Step 7: Add License Management

### Store License Key

```typescript
// utils/license.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const LICENSE_KEY = '@license_key';

export const saveLicenseKey = async (key: string): Promise<void> => {
  await AsyncStorage.setItem(LICENSE_KEY, key);
};

export const getLicenseKey = async (): Promise<string | null> => {
  return await AsyncStorage.getItem(LICENSE_KEY);
};

export const removeLicenseKey = async (): Promise<void> => {
  await AsyncStorage.removeItem(LICENSE_KEY);
};
```

### License Input Screen

```typescript
// screens/LicenseScreen.tsx
import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { saveLicenseKey } from '../utils/license';

const LicenseScreen = ({ navigation }) => {
  const [license, setLicense] = useState('');

  const handleSave = async () => {
    if (license.length !== 29) {
      Alert.alert('Invalid License', 'Please enter a valid license key');
      return;
    }

    await saveLicenseKey(license);
    Alert.alert('Success', 'License key saved');
    navigation.navigate('Home');
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={license}
        onChangeText={setLicense}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
        autoCapitalize="characters"
        maxLength={29}
      />
      <Button title="Save License" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    fontFamily: 'monospace'
  }
});

export default LicenseScreen;
```

---

## Step 8: Production Considerations

### Add Logging

```typescript
// utils/logger.ts
const isDev = __DEV__;

export const logger = {
  debug: (message: string, ...args: any[]) => {
    if (isDev) {
      console.log(`[DEBUG] ${message}`, ...args);
    }
  },
  error: (message: string, error: any) => {
    console.error(`[ERROR] ${message}`, error);
    // Send to error tracking service (e.g., Sentry)
  },
  info: (message: string, ...args: any[]) => {
    if (isDev) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }
};
```

### Add Analytics

```typescript
// utils/analytics.ts
export const analytics = {
  logScanStarted: () => {
    // Track scan started
  },
  logDeviceConnected: (deviceId: string) => {
    // Track device connection
  },
  logWeightReceived: (weight: number) => {
    // Track weight data
  },
  logError: (error: Error) => {
    // Track errors
  }
};
```

### Environment Configuration

```typescript
// config/env.ts
export const config = {
  scanTimeout: __DEV__ ? 15000 : 30000,
  maxRetries: 3,
  enableLogging: __DEV__,
  apiEndpoint: __DEV__ 
    ? 'https://dev-api.example.com'
    : 'https://api.example.com'
};
```

---

## Complete Example

Here's a complete, production-ready example:

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { useKGiTONScale, ScaleDevice } from '@kgiton/react-native-sdk';
import { requestBluetoothPermission } from './utils/permissions';
import { getLicenseKey, saveLicenseKey } from './utils/license';
import { logger } from './utils/logger';
import { analytics } from './utils/analytics';
import ErrorBoundary from './components/ErrorBoundary';

const App = () => {
  const {
    devices,
    weight,
    isScanning,
    isConnected,
    connectionState,
    scan,
    connect,
    disconnect,
    triggerBuzzer
  } = useKGiTONScale();

  const [loading, setLoading] = useState(false);
  const [licenseKey, setLicenseKey] = useState<string | null>(null);

  useEffect(() => {
    loadLicenseKey();
  }, []);

  const loadLicenseKey = async () => {
    const key = await getLicenseKey();
    setLicenseKey(key);
    
    if (!key) {
      Alert.alert(
        'License Required',
        'Please enter your license key to continue'
      );
    }
  };

  const handleScan = async () => {
    try {
      logger.debug('Starting scan');
      analytics.logScanStarted();

      const hasPermission = await requestBluetoothPermission();
      if (!hasPermission) {
        Alert.alert('Permission Required', 'Bluetooth permission is required');
        return;
      }

      await scan(15000);

      if (devices.length === 0) {
        Alert.alert('No Devices', 'No scales found nearby');
      }

      logger.debug(`Found ${devices.length} devices`);
    } catch (error: any) {
      logger.error('Scan failed', error);
      analytics.logError(error);
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleConnect = async (device: ScaleDevice) => {
    if (!licenseKey) {
      Alert.alert('License Required', 'Please enter your license key');
      return;
    }

    setLoading(true);
    try {
      logger.debug('Connecting to device', device.id);
      
      const response = await connect(device.id, licenseKey);

      if (response.success) {
        analytics.logDeviceConnected(device.id);
        logger.debug('Connected successfully');
      } else {
        Alert.alert('Connection Failed', response.message);
      }
    } catch (error: any) {
      logger.error('Connection failed', error);
      analytics.logError(error);
      Alert.alert('Connection Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      logger.debug('Disconnected');
    } catch (error: any) {
      logger.error('Disconnect failed', error);
      Alert.alert('Disconnection Error', error.message);
    }
  };

  const handleBuzzer = async (command: string) => {
    try {
      await triggerBuzzer(command);
      logger.debug(`Buzzer triggered: ${command}`);
    } catch (error: any) {
      logger.error('Buzzer failed', error);
      Alert.alert('Buzzer Error', error.message);
    }
  };

  const renderDevice = ({ item }: { item: ScaleDevice }) => (
    <View style={styles.deviceCard}>
      <View style={styles.deviceInfo}>
        <Text style={styles.deviceName}>{item.name}</Text>
        <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
        {item.licenseKey && (
          <Text style={styles.hasLicense}>✓ Has License</Text>
        )}
      </View>
      <Button
        title="Connect"
        onPress={() => handleConnect(item)}
      />
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
        <Text style={styles.status}>Status: {connectionState}</Text>
      </View>

      {!isConnected ? (
        <View style={styles.content}>
          <Button
            title={isScanning ? 'Scanning...' : 'Scan for Devices'}
            onPress={handleScan}
            disabled={isScanning}
          />

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
              {weight ? weight.weight.toFixed(3) : '---.-'}
            </Text>
            <Text style={styles.unit}>{weight?.unit || 'kg'}</Text>
          </View>

          <View style={styles.controls}>
            <Button title="Beep" onPress={() => handleBuzzer('BEEP')} />
            <Button title="Buzz" onPress={() => handleBuzzer('BUZZ')} />
            <Button title="Long" onPress={() => handleBuzzer('LONG')} />
          </View>

          <Button
            title="Disconnect"
            onPress={handleDisconnect}
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
  status: {
    fontSize: 14,
    color: '#666',
    marginTop: 5
  },
  content: {
    flex: 1,
    padding: 20
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
  hasLicense: {
    fontSize: 12,
    color: '#4CAF50',
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

const Root = () => (
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);

export default Root;
```

---

## Next Steps

- ✅ Basic integration complete
- 📖 Read [Hooks Integration Guide](./16-hooks-integration.md) for advanced patterns
- 📖 Read [Context Integration Guide](./17-context-integration.md) for app-wide state
- 🔧 See [Troubleshooting Guide](./19-troubleshooting.md) if you encounter issues
- ⚙️ Check [Android Setup](./20-android-setup.md) for Android-specific configuration
- 🍎 Check [iOS Setup](./21-ios-setup.md) for iOS-specific configuration

---

## See Also

- [Quick Start Guide](./02-quick-start.md)
- [Hooks API Reference](./09-api-hooks.md)
- [Error Handling](./11-error-handling.md)
- [Testing Guide](./14-testing.md)
