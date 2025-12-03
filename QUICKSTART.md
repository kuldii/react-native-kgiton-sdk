# KGiTON React Native SDK - Quick Start

Get started with KGiTON Scale SDK in 5 minutes!

## 📦 Installation

```bash
npm install @kgiton/react-native-sdk react-native-ble-plx @react-native-async-storage/async-storage
```

## ⚙️ Setup

### iOS (ios/Info.plist)
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Need Bluetooth for scale</string>
```

### Android (android/app/src/main/AndroidManifest.xml)
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

## 🚀 Basic Usage

```typescript
import React, { useEffect } from 'react';
import { View, Text, Button, FlatList, PermissionsAndroid, Platform } from 'react-native';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

// ⚠️ SECURITY: Never commit real license keys! Use environment variables.
const LICENSE_KEY = 'YOUR-LICENSE-KEY-HERE'; // Replace with your actual license key

function ScaleApp() {
  const { service, weight, devices, isConnected } = useKGiTONScale();

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);
    }
  };

  const handleScan = async () => {
    await service.scanForDevices(15000);
  };

  const handleConnect = async (deviceId: string) => {
    const response = await service.connectWithLicenseKey(deviceId, LICENSE_KEY);
    alert(response.message);
  };

  return (
    <View style={{ padding: 20 }}>
      <Text>Weight: {weight ? `${weight.weight.toFixed(3)} kg` : '---.---'}</Text>
      
      {!isConnected && (
        <>
          <Button title="Scan Devices" onPress={handleScan} />
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
      )}
      
      {isConnected && (
        <Button title="Disconnect" onPress={() => service.disconnect()} />
      )}
    </View>
  );
}

export default ScaleApp;
```

## 🎯 Alternative: Context API

```typescript
// App.tsx
import { ScaleProvider } from '@kgiton/react-native-sdk';

function App() {
  return (
    <ScaleProvider>
      <ScaleScreen />
    </ScaleProvider>
  );
}

// ScaleScreen.tsx
import { useScaleContext } from '@kgiton/react-native-sdk';

function ScaleScreen() {
  const { service, weight, isConnected } = useScaleContext();
  
  return (
    <View>
      <Text>Weight: {weight?.weight.toFixed(3)} kg</Text>
    </View>
  );
}
```

## 🔑 Key Features

- ✅ **Scan**: `service.scanForDevices()`
- ✅ **Connect**: `service.connectWithLicenseKey(deviceId, key)`
- ✅ **Weight Data**: Listen via `onWeightData` event
- ✅ **Buzzer**: `service.triggerBuzzer('BEEP')`
- ✅ **Disconnect**: `service.disconnect()`

## 📚 Next Steps

- [Complete Documentation](README.md)
- [Integration Guide](docs/INTEGRATION.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)
- [Example App](example/README.md)

## 🆘 Need Help?

- Email: support@kgiton.com
- Docs: https://github.com/kuldii/react-native-kgiton-sdk

---

© 2025 PT KGiTON. All rights reserved.
