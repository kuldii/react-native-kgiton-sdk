# KGiTON React Native SDK - Integration Guide

Complete step-by-step guide for integrating KGiTON SDK into your React Native application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [iOS Configuration](#ios-configuration)
4. [Android Configuration](#android-configuration)
5. [Basic Integration](#basic-integration)
6. [Advanced Usage](#advanced-usage)
7. [TypeScript Setup](#typescript-setup)
8. [Testing](#testing)

## Prerequisites

### Requirements

- Node.js >= 14.x
- React Native >= 0.60.0
- iOS 10.0+ (for iOS apps)
- Android 5.0+ / API 21+ (for Android apps)
- Valid KGiTON license key

### Development Tools

- Xcode 12+ (for iOS)
- Android Studio (for Android)
- CocoaPods (for iOS dependencies)

## Installation

### Step 1: Install SDK

```bash
npm install @kgiton/react-native-sdk
# or
yarn add @kgiton/react-native-sdk
```

### Step 2: Install Peer Dependencies

```bash
npm install react-native-ble-plx @react-native-async-storage/async-storage
# or
yarn add react-native-ble-plx @react-native-async-storage/async-storage
```

### Step 3: Link Native Dependencies (if needed)

For React Native < 0.60:
```bash
react-native link react-native-ble-plx
react-native link @react-native-async-storage/async-storage
```

For React Native >= 0.60, autolinking should work automatically.

## iOS Configuration

### Step 1: Install Pods

```bash
cd ios
pod install
cd ..
```

### Step 2: Update Info.plist

Add Bluetooth usage descriptions to `ios/YourApp/Info.plist`:

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to KGiTON scale devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to connect to KGiTON scale devices</string>
```

### Step 3: Enable Background Modes (Optional)

If you need background BLE support, add to Info.plist:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>bluetooth-central</string>
</array>
```

### Step 4: Update Podfile (if needed)

Ensure minimum iOS version in `ios/Podfile`:

```ruby
platform :ios, '10.0'
```

## Android Configuration

### Step 1: Update AndroidManifest.xml

Add permissions to `android/app/src/main/AndroidManifest.xml`:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- Bluetooth permissions for Android 12+ -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    
    <!-- Location permission (required for BLE on Android) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <!-- Legacy Bluetooth permissions (for Android < 12) -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    
    <application ...>
        ...
    </application>
</manifest>
```

### Step 2: Update build.gradle

Ensure minimum SDK version in `android/app/build.gradle`:

```gradle
android {
    defaultConfig {
        minSdkVersion 21
        targetSdkVersion 33
        ...
    }
}
```

### Step 3: Add Jitpack Repository

Add to `android/build.gradle`:

```gradle
allprojects {
    repositories {
        maven { url 'https://jitpack.io' }
    }
}
```

## Basic Integration

### Step 1: Import SDK

```typescript
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
} from '@kgiton/react-native-sdk';
```

### Step 2: Create Service Instance

```typescript
import React, { useState, useEffect } from 'react';

function ScaleScreen() {
  const [service] = useState(() => new KGiTONScaleService(true));

  useEffect(() => {
    return () => {
      service.dispose();
    };
  }, []);

  // ... rest of component
}
```

### Step 3: Setup Event Handlers

```typescript
useEffect(() => {
  service.setEventHandlers({
    onWeightData: (data) => {
      console.log('Weight:', data.weight);
    },
    onConnectionStateChange: (state) => {
      console.log('State:', state);
    },
    onDevicesFound: (devices) => {
      console.log('Devices:', devices);
    },
    onError: (error) => {
      console.error('Error:', error);
    },
  });
}, []);
```

### Step 4: Request Permissions

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
  if (Platform.OS === 'android') {
    const permissions = [
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ];

    const granted = await PermissionsAndroid.requestMultiple(permissions);
    
    return Object.values(granted).every(
      (result) => result === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true;
};
```

### Step 5: Scan and Connect

```typescript
const scanAndConnect = async () => {
  // Request permissions
  const hasPermissions = await requestPermissions();
  if (!hasPermissions) {
    alert('Permissions required');
    return;
  }

  // Check Bluetooth
  const isEnabled = await service.isBluetoothEnabled();
  if (!isEnabled) {
    alert('Please enable Bluetooth');
    return;
  }

  // Scan for devices
  await service.scanForDevices(15000);

  // Connect (after selecting device from list)
  const response = await service.connectWithLicenseKey(
    deviceId,
    'YOUR-LICENSE-KEY'
  );

  if (response.success) {
    console.log('Connected!');
  }
};
```

## Advanced Usage

### Custom Logger

```typescript
const service = new KGiTONScaleService(false); // Disable default logging

// Implement custom logger
service.setEventHandlers({
  onError: (error) => {
    // Send to your logging service
    MyLogger.error('KGiTON Error:', error);
  },
});
```

### Connection State Monitoring

```typescript
import { ConnectionStateHelpers } from '@kgiton/react-native-sdk';

service.setEventHandlers({
  onConnectionStateChange: (state) => {
    if (ConnectionStateHelpers.isAuthenticated(state)) {
      // Device authenticated, ready to receive data
    } else if (ConnectionStateHelpers.isConnected(state)) {
      // Connected but not authenticated yet
    } else {
      // Disconnected
    }
  },
});
```

### Saved License Keys

The SDK automatically saves license keys when successfully connected. On subsequent scans, devices with saved keys will have the `licenseKey` property populated:

```typescript
service.setEventHandlers({
  onDevicesFound: (devices) => {
    devices.forEach((device) => {
      if (device.licenseKey) {
        // This device has been connected before
        // Can auto-connect with saved key
      }
    });
  },
});
```

### Weight Data Processing

```typescript
import { WeightDataFactory } from '@kgiton/react-native-sdk';

service.setEventHandlers({
  onWeightData: (data) => {
    const formatted = WeightDataFactory.getDisplayWeight(data);
    const raw = WeightDataFactory.getRawWeight(data);
    
    console.log(`Display: ${formatted}, Raw: ${raw}`);
  },
});
```

## TypeScript Setup

### Type Definitions

The SDK is fully typed. Import types as needed:

```typescript
import type {
  ScaleDevice,
  WeightData,
  ControlResponse,
  ScaleConnectionState,
  KGiTONEvents,
} from '@kgiton/react-native-sdk';
```

### Component Example

```typescript
import React, { FC, useState, useEffect } from 'react';
import { KGiTONScaleService, WeightData } from '@kgiton/react-native-sdk';

interface ScaleProps {
  licenseKey: string;
}

const ScaleComponent: FC<ScaleProps> = ({ licenseKey }) => {
  const [service] = useState(() => new KGiTONScaleService());
  const [weight, setWeight] = useState<WeightData | null>(null);

  useEffect(() => {
    service.setEventHandlers({
      onWeightData: setWeight,
    });

    return () => {
      service.dispose();
    };
  }, []);

  return (
    <div>
      {weight ? `${weight.weight.toFixed(3)} kg` : 'No data'}
    </div>
  );
};
```

## Testing

### Unit Testing

```typescript
import { DataValidation } from '@kgiton/react-native-sdk';

describe('KGiTON SDK', () => {
  it('validates weight strings', () => {
    expect(DataValidation.validateWeightString('123.456')).toBe(true);
    expect(DataValidation.validateWeightString('invalid')).toBe(false);
  });

  it('validates license keys', () => {
    expect(
      DataValidation.validateLicenseKey('KG7M2-P8VQX-9WFHJ-3NRTK-4BCDL')
    ).toBe(true);
    expect(DataValidation.validateLicenseKey('invalid')).toBe(false);
  });
});
```

### Integration Testing

Mock the BLE manager for testing:

```typescript
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn().mockImplementation(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    // ... other methods
  })),
}));
```

## Common Patterns

### React Context for Global State

```typescript
import React, { createContext, useContext } from 'react';
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

const ScaleContext = createContext<KGiTONScaleService | null>(null);

export const ScaleProvider: React.FC = ({ children }) => {
  const [service] = useState(() => new KGiTONScaleService());

  return (
    <ScaleContext.Provider value={service}>
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = () => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error('useScale must be used within ScaleProvider');
  }
  return context;
};
```

### Custom Hook

```typescript
import { useState, useEffect } from 'react';
import { KGiTONScaleService, WeightData } from '@kgiton/react-native-sdk';

export const useKGiTONScale = () => {
  const [service] = useState(() => new KGiTONScaleService());
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    service.setEventHandlers({
      onWeightData: setWeight,
      onConnectionStateChange: (state) => {
        setIsConnected(service.isConnected());
      },
    });

    return () => {
      service.dispose();
    };
  }, []);

  return {
    service,
    weight,
    isConnected,
  };
};
```

## Next Steps

- Read [README.md](../README.md) for complete API reference
- Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md) for common issues
- See [example/](../example/) for complete app example
- Review [SECURITY.md](../SECURITY.md) for best practices

---

© 2025 PT KGiTON. All rights reserved.
