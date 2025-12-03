<div align="center">
  <img src="logo/kgiton-logo.png" alt="KGiTON Logo" width="200"/>
  
  # KGiTON React Native SDK
  
  ### Professional BLE Scale Integration for React Native
  
  [![License: Proprietary](https://img.shields.io/badge/License-Proprietary-red.svg)](LICENSE)
  [![Platform](https://img.shields.io/badge/platform-Android%20%7C%20iOS-blue.svg)](https://github.com/kuldii/react-native-kgiton-sdk)
  [![npm version](https://img.shields.io/badge/npm-v1.0.0-brightgreen.svg)](https://www.npmjs.com/package/@kgiton/react-native-sdk)
  [![React Native](https://img.shields.io/badge/React%20Native-%E2%89%A50.70.0-61dafb.svg)](https://reactnative.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6.svg)](https://www.typescriptlang.org/)
  
  [Documentation](./docs) • [Quick Start](./docs/02-quick-start.md) • [API Reference](./docs/07-api-service.md) • [Examples](./example)
  
</div>

---

## 📖 Overview

The **KGiTON React Native SDK** provides a comprehensive, production-ready solution for integrating ESP32-based scale devices with React Native applications via Bluetooth Low Energy (BLE). Built with TypeScript and designed for enterprise use, this SDK handles device discovery, secure authentication, real-time weight data streaming, and device control.

### Why Choose KGiTON SDK?

- 🏢 **Enterprise-Grade**: Battle-tested in production environments
- 🔒 **Secure**: License-based authentication with encrypted communication
- ⚡ **High Performance**: Optimized for real-time data streaming
- 🎯 **Type-Safe**: Full TypeScript support with comprehensive types
- 📱 **Cross-Platform**: Single codebase for iOS and Android
- 🛠️ **Developer-Friendly**: Intuitive API with extensive documentation
- 🔧 **Flexible Integration**: Service class, React Hooks, or Context API
- 🐛 **Production-Ready**: Comprehensive error handling and logging

> **⚠️ PROPRIETARY SOFTWARE**: This SDK is commercial software owned by PT KGiTON. Use requires explicit authorization. See [AUTHORIZATION.md](AUTHORIZATION.md) for licensing information.

## 📖 Overview

KGiTON React Native SDK provides a comprehensive solution for integrating ESP32-based scale devices with React Native applications via Bluetooth Low Energy (BLE). This SDK handles device discovery, authentication, real-time weight data streaming, and buzzer control.

## ✨ Key Features

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 📡 **BLE Device Scanning** | Discover nearby KGiTON scale devices with signal strength (RSSI) |
| ⚡ **Real-time Data Streaming** | Receive weight measurements at ~10 Hz with sub-gram precision |
| 🔐 **Secure Authentication** | License-based device authentication with automatic key persistence |
| 🔊 **Buzzer Control** | Send audio feedback commands (BEEP, BUZZ, LONG, OFF) |
| 🔄 **Connection Management** | Automatic state tracking with reconnection handling |
| 📱 **Cross-Platform** | Single codebase for iOS (13.0+) and Android (API 21+) |
| 🎯 **TypeScript First** | Fully typed API with IntelliSense support |
| 🛡️ **Error Handling** | Comprehensive exception system with detailed error messages |
| 💾 **Data Persistence** | Automatic license key storage and retrieval |
| 📊 **Connection Stability** | Built-in monitoring and stability metrics |

### Integration Options

- **🔧 Direct Service**: `KGiTONScaleService` class for maximum control
- **🎣 React Hooks**: Pre-built hooks for common operations (`useKGiTONScale`, `useWeight`, etc.)
- **🌐 Context API**: `ScaleProvider` for app-wide state management
- **📦 Modular Design**: Use only what you need

## 📋 Requirements

### Software Requirements

| Component | Minimum Version | Recommended |
|-----------|----------------|-------------|
| **React Native** | 0.70.0 | 0.74.0+ |
| **React** | 17.0.0 | 18.2.0+ |
| **Node.js** | 14.0 | 18.0+ |
| **TypeScript** | 4.0 | 5.0+ (optional) |

### Platform Requirements

| Platform | Minimum | Target | Notes |
|----------|---------|--------|-------|
| **iOS** | 13.0 | 15.0+ | Physical device required |
| **Android** | API 21 (5.0) | API 33+ | Physical device required |

### Hardware Requirements

- 📱 Physical device with **Bluetooth 4.0+ (BLE)** support
- ⚠️ **Emulators/Simulators are NOT supported** (no BLE hardware)
- 🔋 KGiTON ESP32-based scale device
- 🔑 Valid license key from PT KGiTON

> **📖 Detailed Requirements**: See [Requirements Documentation](./docs/03-requirements.md) for complete system requirements.

## 🔐 Authorization Required

**This SDK requires explicit authorization from PT KGiTON.**

📋 **[Read Authorization Guide](AUTHORIZATION.md)** for licensing information.  
🔒 **[Security Best Practices](SECURITY.md)** - Important security guidelines

To obtain a license:
1. Email: support@kgiton.com
2. Subject: "KGiTON SDK License Request"
3. Include: Company name, use case, contact information

> ⚠️ **Security Notice**: Never hardcode license keys in your source code. Use environment variables or secure storage. See our [security guide](SECURITY.md) for best practices.

## 🚀 Quick Installation

### Installation via NPM

```bash
# Install the SDK
npm install @kgiton/react-native-sdk

# Install required dependencies
npm install react-native-ble-plx @react-native-async-storage/async-storage
```

### Installation via GitHub

```bash
# Install directly from GitHub repository
npm install https://github.com/kuldii/react-native-kgiton-sdk.git

# Install dependencies
npm install react-native-ble-plx @react-native-async-storage/async-storage
```

### Platform Configuration

#### iOS Setup

```bash
cd ios && pod install && cd ..
```

Add to `ios/YourApp/Info.plist`:

```xml
<dict>
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>This app needs Bluetooth to connect to your KGiTON scale device</string>
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>This app needs Bluetooth to communicate with your KGiTON scale device</string>
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs location permission to scan for Bluetooth devices</string>
</dict>
```

#### Android Setup

Add to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest>
    <!-- Bluetooth permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
    
    <!-- Android 12+ (API 31+) -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    
    <!-- Location permission for BLE scanning -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
</manifest>
```

Update `android/build.gradle` minSdkVersion:

```gradle
buildscript {
    ext {
        minSdkVersion = 21
    }
}
```

> **📖 Complete Installation Guide**: See [Installation Documentation](./docs/01-installation.md) for detailed setup instructions including permissions, ProGuard rules, and troubleshooting.

## 📚 Usage

### Quick Start (5 Minutes)

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, Button } from 'react-native';
import { 
  KGiTONScaleService, 
  WeightData, 
  ScaleDevice 
} from '@kgiton/react-native-sdk';

const App = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [devices, setDevices] = useState<ScaleDevice[]>([]);

  useEffect(() => {
    // Setup event handlers
    service.setEventHandlers({
      onWeightData: (data) => setWeight(data),
      onDevicesFound: (devices) => setDevices(devices),
      onError: (error) => console.error(error),
    });

    // Cleanup on unmount
    return () => service.dispose();
  }, [service]);

  const handleScan = async () => {
    if (await service.isBluetoothEnabled()) {
      await service.scanForDevices(15000);
    }
  };

  const handleConnect = async (deviceId: string) => {
    const response = await service.connectWithLicenseKey(
      deviceId,
      'YOUR-LICENSE-KEY'
    );
    console.log(response.message);
  };

  return (
    <View>
      <Text>Weight: {weight ? `${weight.weight.toFixed(3)} kg` : 'N/A'}</Text>
      <Button title="Scan Devices" onPress={handleScan} />
      {devices.map(device => (
        <Button
          key={device.id}
          title={device.name}
          onPress={() => handleConnect(device.id)}
        />
      ))}
    </View>
  );
};

export default App;
```

### Core Operations

#### 1. Initialize Service

```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

// Create service instance (enable logging for development)
const service = new KGiTONScaleService(true);
```

#### 2. Scan for Devices

```typescript
// Start scanning with 15-second timeout
await service.scanForDevices(15000);

// Stop scanning manually
service.stopScan();

// Get discovered devices
const devices = service.getAvailableDevices();
```

#### 3. Connect & Authenticate

```typescript
// Connect with license key
const response = await service.connectWithLicenseKey(
  deviceId,
  'XXXXX-XXXXX-XXXXX-XXXXX-XXXXX'
);

// Check authentication status
if (service.isAuthenticated()) {
  console.log('Ready to receive data');
}
```

#### 4. Receive Weight Data

```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    console.log(`Weight: ${data.weight} kg`);
    console.log(`Time: ${new Date(data.timestamp)}`);
  }
});
```

#### 5. Control Buzzer

```typescript
await service.triggerBuzzer('BEEP');  // Short beep
await service.triggerBuzzer('BUZZ');  // Standard buzz
await service.triggerBuzzer('LONG');  // Long beep
await service.triggerBuzzer('OFF');   // Silent
```

#### 6. Disconnect

```typescript
// Proper disconnect with license key
await service.disconnectWithLicenseKey('YOUR-LICENSE-KEY');

// Or force disconnect
await service.disconnect();
```

> **📖 Detailed Usage Guide**: See [Quick Start Guide](./docs/02-quick-start.md) for more examples and advanced usage patterns.

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

## 📖 API Documentation

### KGiTONScaleService Class

The main service class for all BLE scale operations.

#### Constructor

```typescript
new KGiTONScaleService(enableLogging?: boolean)
```

**Parameters:**
- `enableLogging` (optional): Enable console logging. Default: `false`

#### Methods Overview

| Category | Method | Description |
|----------|--------|-------------|
| **Scanning** | `scanForDevices(timeout?)` | Start scanning for BLE devices |
| | `stopScan()` | Stop active scan |
| | `getAvailableDevices()` | Get discovered devices |
| **Connection** | `connectWithLicenseKey(deviceId, key)` | Connect and authenticate |
| | `disconnect()` | Disconnect from device |
| | `disconnectWithLicenseKey(key)` | Proper disconnect with auth |
| **Status** | `isBluetoothEnabled()` | Check Bluetooth status |
| | `isConnected()` | Check connection status |
| | `isAuthenticated()` | Check authentication status |
| | `getConnectionState()` | Get current state |
| | `getConnectedDevice()` | Get connected device info |
| **Control** | `triggerBuzzer(command)` | Control device buzzer |
| **Events** | `setEventHandlers(handlers)` | Register event callbacks |
| | `removeEventHandler(event)` | Remove specific handler |
| **Cleanup** | `dispose()` | Release all resources |

### Data Models

#### ScaleDevice

```typescript
interface ScaleDevice {
  id: string;              // Unique device identifier
  name: string;            // Device name (e.g., "KGiTON-001")
  rssi: number;            // Signal strength in dBm
  licenseKey?: string;     // Stored license key (if available)
}
```

#### WeightData

```typescript
interface WeightData {
  weight: number;          // Weight value in kg
  timestamp: number;       // Unix timestamp in milliseconds
  deviceId: string;        // Source device ID
  unit?: string;           // Measurement unit (default: 'kg')
}
```

#### ControlResponse

```typescript
interface ControlResponse {
  success: boolean;        // Operation success status
  message: string;         // Human-readable message
  data?: any;             // Optional additional data
}
```

#### ScaleConnectionState

```typescript
enum ScaleConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR'
}
```

### Event Handlers

```typescript
interface KGiTONEvents {
  onWeightData: (data: WeightData) => void;
  onConnectionStateChange: (state: ScaleConnectionState) => void;
  onDevicesFound: (devices: ScaleDevice[]) => void;
  onError: (error: Error) => void;
}
```

### React Hooks (Optional)

Pre-built hooks for easy integration:

```typescript
// All-in-one hook
const { service, weight, devices, connectionState } = useKGiTONScale();

// Individual hooks
const devices = useDeviceScan();
const connectionState = useDeviceConnection(deviceId, licenseKey);
const { trigger, isTriggering } = useBuzzer();
const weight = useWeight();
```

### Context API (Optional)

```typescript
// Wrap your app
<ScaleProvider>
  <YourApp />
</ScaleProvider>

// Use in components
const { service, weight, connectionState } = useScaleContext();
```

> **📖 Complete API Reference**: 
> - [Service API Documentation](./docs/07-api-service.md)
> - [Models & Types](./docs/08-api-models.md)
> - [Hooks API](./docs/09-api-hooks.md)
> - [Context API](./docs/10-api-context.md)

## 📚 Documentation

### Getting Started
- 📖 [Installation Guide](./docs/01-installation.md) - Complete setup instructions
- 🚀 [Quick Start](./docs/02-quick-start.md) - Get running in 5 minutes
- 📋 [Requirements](./docs/03-requirements.md) - System and platform requirements

### Core Concepts
- 🏗️ [Architecture Overview](./docs/04-architecture.md) - Understanding the SDK
- 📡 [BLE Communication](./docs/05-ble-communication.md) - How BLE works
- 🔐 [Authentication & Licensing](./docs/06-authentication.md) - Security and auth

### API Reference
- 🔧 [Service API](./docs/07-api-service.md) - KGiTONScaleService reference
- 📦 [Models & Types](./docs/08-api-models.md) - Data models and TypeScript types
- 🎣 [Hooks API](./docs/09-api-hooks.md) - React Hooks reference
- 🌐 [Context API](./docs/10-api-context.md) - Context provider reference

### Advanced Topics
- ⚠️ [Error Handling](./docs/11-error-handling.md) - Exception handling
- 🔄 [Connection Stability](./docs/12-connection-stability.md) - Managing connections
- ⚡ [Performance Optimization](./docs/13-performance.md) - Best practices
- 🧪 [Testing](./docs/14-testing.md) - Testing your integration

### Integration Guides
- 📱 [Basic Integration](./docs/15-basic-integration.md) - Step-by-step guide
- 🎣 [Using Hooks](./docs/16-hooks-integration.md) - Hooks-based integration
- 🌐 [Using Context](./docs/17-context-integration.md) - Context-based integration
- 🔓 [Permissions Setup](./docs/18-permissions.md) - Platform permissions
- 🐛 [Troubleshooting](./docs/19-troubleshooting.md) - Common issues and solutions

### Examples
- 📁 [Example App](./example/) - Complete working examples
- 🔧 [Service Integration](./example/App.tsx) - Direct service usage
- 🎣 [Hooks Integration](./example/AppWithHooks.tsx) - Using hooks
- 🌐 [Context Integration](./example/AppWithContext.tsx) - Using context

## 🔒 Security & Compliance

### Security Best Practices

- 🔐 **Never hardcode license keys** in source code
- 💾 **Use secure storage** (SDK handles this automatically)
- 🔒 **Validate all inputs** before sending to device
- 📝 **Enable logging only in development** builds
- 🔍 **Monitor connection security** using built-in stability monitoring

**Security Policy**: See [SECURITY.md](SECURITY.md) for vulnerability reporting and security guidelines.

## 🐛 Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| No devices found | Ensure Bluetooth is enabled, permissions granted, and device is powered on |
| Connection fails | Verify license key is correct and device is not connected elsewhere |
| No weight data | Check device is authenticated (not just connected) |
| Permissions denied | Request runtime permissions on Android 6.0+ |
| Emulator doesn't work | Use physical device only - emulators don't have BLE hardware |

**Full Troubleshooting Guide**: See [Troubleshooting Documentation](./docs/19-troubleshooting.md)

## 📝 License & Authorization

**PROPRIETARY SOFTWARE - ALL RIGHTS RESERVED**

Copyright © 2025 PT KGiTON. All Rights Reserved.

This SDK is commercial software that requires explicit authorization from PT KGiTON. Unauthorized use, reproduction, modification, or distribution is strictly prohibited and may result in legal action.

### Obtaining a License

📧 **Email**: support@kgiton.com  
📋 **Subject**: "KGiTON SDK License Request"  
📄 **Include**: Company name, intended use case, contact information

**Authorization Guide**: See [AUTHORIZATION.md](AUTHORIZATION.md) for complete licensing information.

## 🆘 Support & Resources

### For Authorized Users

| Resource | Link |
|----------|------|
| 🐛 **Report Issues** | [GitHub Issues](https://github.com/kuldii/react-native-kgiton-sdk/issues) |
| 📧 **Technical Support** | support@kgiton.com |
| 🔒 **Security Issues** | security@kgiton.com |
| 📖 **Documentation** | [Full Docs](./docs) |
| 💬 **Discussions** | [GitHub Discussions](https://github.com/kuldii/react-native-kgiton-sdk/discussions) |
| 🌐 **Website** | https://kgiton.com |

### Community

- ⭐ Star this repository
- 🐛 Report bugs and issues
- 💡 Suggest features and improvements
- 📝 Contribute to documentation (authorized users only)

## 🚀 Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and update notes.

## 🏢 About PT KGiTON

PT KGiTON is a leading provider of IoT-enabled weighing solutions, specializing in precision scale devices for industrial, commercial, and enterprise applications.

**Products**:
- ESP32-based BLE scale devices
- Cloud-connected weighing solutions
- Enterprise scale management platforms

**Learn More**: [https://kgiton.com](https://kgiton.com)

---

<div align="center">
  
  **KGiTON React Native SDK v1.0.0**
  
  Made with ❤️ by PT KGiTON
  
  © 2025 PT KGiTON. All rights reserved.
  
  [Documentation](./docs) • [GitHub](https://github.com/kuldii/react-native-kgiton-sdk) • [Website](https://kgiton.com)
  
</div>
