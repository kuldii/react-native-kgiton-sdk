# KGiTON React Native SDK

<div align="center">

<img src="logo/kgiton-logo.png" alt="KGiTON Logo" width="200"/>

[![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-lightgrey.svg)](https://github.com/kuldii/react-native-kgiton-sdk)
[![npm version](https://img.shields.io/badge/npm-v1.0.0-blue.svg)](https://www.npmjs.com/package/@kgiton/react-native-sdk)

Official React Native SDK for integrating with KGiTON BLE scale devices.

</div>

> **⚠️ PROPRIETARY SOFTWARE**: This SDK is commercial software owned by PT KGiTON. Use requires explicit authorization. See [AUTHORIZATION.md](AUTHORIZATION.md) for licensing information.

## 📖 Overview

KGiTON React Native SDK provides a comprehensive solution for integrating ESP32-based scale devices with React Native applications via Bluetooth Low Energy (BLE). This SDK handles device discovery, authentication, real-time weight data streaming, and buzzer control.

## ✨ Features

- ✅ **Cross-platform**: iOS + Android support
- ✅ **BLE Device Scanning**: Discover nearby KGiTON scale devices with RSSI
- ✅ **Real-time Weight Data**: Stream weight data at ~10 Hz
- ✅ **License-based Authentication**: Secure device access with license keys
- ✅ **Buzzer Control**: Send buzzer commands (BEEP, BUZZ, LONG, OFF)
- ✅ **Connection State Management**: Track connection lifecycle
- ✅ **Type-safe API**: Full TypeScript support
- ✅ **Error Handling**: Comprehensive exception system
- ✅ **Auto-reconnection**: Built-in connection stability monitoring

## 📋 Requirements

- React Native >= 0.60.0
- React >= 16.8.0
- iOS 10.0+ / Android 5.0+ (API 21+)

## 🔐 Authorization Required

**This SDK requires explicit authorization from PT KGiTON.**

📋 **[Read Authorization Guide](AUTHORIZATION.md)** for licensing information.  
🔒 **[Security Best Practices](SECURITY.md)** - Important security guidelines

To obtain a license:
1. Email: support@kgiton.com
2. Subject: "KGiTON SDK License Request"
3. Include: Company name, use case, contact information

> ⚠️ **Security Notice**: Never hardcode license keys in your source code. Use environment variables or secure storage. See our [security guide](SECURITY.md) for best practices.

## 🚀 Installation

### Step 1: Install the SDK

```bash
npm install @kgiton/react-native-sdk
# or
yarn add @kgiton/react-native-sdk
```

### Step 2: Install Dependencies

```bash
npm install react-native-ble-plx @react-native-async-storage/async-storage
# or
yarn add react-native-ble-plx @react-native-async-storage/async-storage
```

### Step 3: iOS Setup

```bash
cd ios && pod install
```

Add to `ios/Podfile`:
```ruby
permissions_path = '../node_modules/react-native-permissions/ios'
pod 'Permission-BluetoothPeripheral', :path => "#{permissions_path}/BluetoothPeripheral"
```

Add to `ios/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Need Bluetooth to connect to scale devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>Need Bluetooth to connect to scale devices</string>
```

### Step 4: Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

Add to `android/build.gradle`:
```gradle
allprojects {
    repositories {
        maven { url 'https://jitpack.io' }
    }
}
```

### Step 5: Request Permissions

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

async function requestPermissions() {
  if (Platform.OS === 'android') {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);
    
    return Object.values(granted).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
}
```

## 📚 Basic Usage

### Initialize SDK

```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

// Create instance
const scaleService = new KGiTONScaleService(true); // true = enable logging

// Setup event handlers
scaleService.setEventHandlers({
  onWeightData: (data) => {
    console.log(`Weight: ${data.weight.toFixed(3)} kg`);
  },
  onConnectionStateChange: (state) => {
    console.log(`State: ${state}`);
  },
  onDevicesFound: (devices) => {
    console.log(`Found ${devices.length} devices`);
  },
  onError: (error) => {
    console.error('Error:', error.message);
  },
});
```

### Scan for Devices

```typescript
// Check Bluetooth status
const isEnabled = await scaleService.isBluetoothEnabled();
if (!isEnabled) {
  await scaleService.enableBluetooth();
}

// Start scanning
await scaleService.scanForDevices(15000); // 15 seconds timeout

// Stop scanning
scaleService.stopScan();

// Get discovered devices
const devices = scaleService.getAvailableDevices();
```

### Connect to Device

```typescript
// Connect with license key
const response = await scaleService.connectWithLicenseKey(
  deviceId,
  'YOUR-LICENSE-KEY-HERE' // Your actual license key
);

if (response.success) {
  console.log('Connected successfully!');
} else {
  console.error('Connection failed:', response.message);
}

// Check connection status
const isConnected = scaleService.isConnected();
const isAuthenticated = scaleService.isAuthenticated();
```

### Control Buzzer

```typescript
// Different buzzer commands
await scaleService.triggerBuzzer('BEEP');  // Short beep
await scaleService.triggerBuzzer('BUZZ');  // Standard buzz
await scaleService.triggerBuzzer('LONG');  // Long beep
await scaleService.triggerBuzzer('OFF');   // Turn off
```

### Disconnect

```typescript
// Disconnect with license key (proper way)
await scaleService.disconnectWithLicenseKey('YOUR-LICENSE-KEY');

// Force disconnect (without license key)
await scaleService.disconnect();
```

### Cleanup

```typescript
// When component unmounts
useEffect(() => {
  return () => {
    scaleService.dispose();
  };
}, []);
```

## 🎯 Complete Example

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, Button, FlatList } from 'react-native';
import { KGiTONScaleService, ScaleDevice, WeightData } from '@kgiton/react-native-sdk';

const ScaleApp = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [connectionState, setConnectionState] = useState('disconnected');

  useEffect(() => {
    service.setEventHandlers({
      onWeightData: setWeight,
      onConnectionStateChange: setConnectionState,
      onDevicesFound: setDevices,
      onError: (error) => console.error(error),
    });

    return () => {
      service.dispose();
    };
  }, []);

  const handleScan = async () => {
    await service.scanForDevices(15000);
  };

  const handleConnect = async (deviceId: string) => {
    const response = await service.connectWithLicenseKey(
      deviceId,
      'YOUR-LICENSE-KEY-HERE'
    );
    alert(response.message);
  };

  const handleBuzzer = async () => {
    await service.triggerBuzzer('BEEP');
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>State: {connectionState}</Text>
      {weight && <Text>Weight: {weight.weight.toFixed(3)} kg</Text>}
      
      <Button title="Scan" onPress={handleScan} />
      <Button title="Buzzer" onPress={handleBuzzer} />
      
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
    </View>
  );
};

export default ScaleApp;
```

## 📖 API Reference

### KGiTONScaleService

#### Constructor
```typescript
constructor(enableLogging?: boolean)
```

#### Methods

##### Device Scanning
- `scanForDevices(timeoutMs?: number): Promise<void>` - Start scanning for devices
- `stopScan(): void` - Stop scanning
- `getAvailableDevices(): ScaleDevice[]` - Get list of discovered devices

##### Connection
- `connectWithLicenseKey(deviceId: string, licenseKey: string): Promise<ControlResponse>` - Connect with authentication
- `disconnectWithLicenseKey(licenseKey: string): Promise<ControlResponse>` - Disconnect properly
- `disconnect(): Promise<void>` - Force disconnect

##### Buzzer Control
- `triggerBuzzer(command: string): Promise<void>` - Control buzzer (BEEP, BUZZ, LONG, OFF)

##### State
- `isBluetoothEnabled(): Promise<boolean>` - Check Bluetooth status
- `getConnectionState(): ScaleConnectionState` - Get current state
- `isConnected(): boolean` - Check if connected
- `isAuthenticated(): boolean` - Check if authenticated
- `getConnectedDevice(): ScaleDevice | null` - Get connected device

##### Event Handlers
- `setEventHandlers(handlers: Partial<KGiTONEvents>): void` - Set event callbacks
- `removeEventHandler(event: keyof KGiTONEvents): void` - Remove specific handler

##### Cleanup
- `dispose(): Promise<void>` - Cleanup resources

#### Events

```typescript
interface KGiTONEvents {
  onWeightData: (data: WeightData) => void;
  onConnectionStateChange: (state: ScaleConnectionState) => void;
  onDevicesFound: (devices: ScaleDevice[]) => void;
  onError: (error: Error) => void;
}
```

### Models

#### ScaleDevice
```typescript
interface ScaleDevice {
  name: string;
  id: string;
  rssi: number;
  licenseKey?: string;
}
```

#### WeightData
```typescript
interface WeightData {
  weight: number;
  timestamp: Date;
  unit: string;
}
```

#### ControlResponse
```typescript
interface ControlResponse {
  success: boolean;
  message: string;
  timestamp: Date;
}
```

#### ScaleConnectionState
```typescript
enum ScaleConnectionState {
  DISCONNECTED = 'disconnected',
  SCANNING = 'scanning',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  AUTHENTICATED = 'authenticated',
  ERROR = 'error',
}
```

## 🔒 Security

See [SECURITY.md](SECURITY.md) for security policy and vulnerability reporting.

## 📝 License

**PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED**

Copyright (c) 2025 PT KGiTON. All Rights Reserved.

This SDK may only be used by individuals or organizations explicitly authorized by PT KGiTON. Unauthorized use, reproduction, or distribution is strictly prohibited.

See [LICENSE](LICENSE) file for complete terms and conditions.

## 🆘 Support

For authorized users:
- 🐛 [Report Issues](https://github.com/kuldii/react-native-kgiton-sdk/issues)
- 📧 Technical Support: support@kgiton.com
- 🔒 Security Issues: support@kgiton.com
- 🌐 Website: https://kgiton.com

## 📄 Additional Documentation

- 📘 [Authorization Guide](AUTHORIZATION.md) - How to obtain license
- 🔐 [Security Policy](SECURITY.md) - Security and vulnerability reporting
- 📚 [Example App](example/) - Complete working example
- 🔧 [Integration Guide](docs/INTEGRATION.md) - Detailed integration steps
- 🐛 [Troubleshooting](docs/TROUBLESHOOTING.md) - Common issues and solutions

---

**SDK Version:** 1.0.0  
**Platform:** iOS + Android  
**React Native:** ≥0.60.0  
© 2025 PT KGiTON. All rights reserved.
