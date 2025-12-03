# KGiTON SDK Example Apps

This directory contains three complete React Native example applications demonstrating different approaches to use the KGiTON SDK.

## 📁 Available Examples

1. **App.tsx** - Basic approach using direct service instance
2. **AppWithHooks.tsx** - Modern approach using React Hooks  
3. **AppWithContext.tsx** - Component-based approach using Context Provider

## 🎯 Which Example Should I Use?

- **Basic (App.tsx)**: Best for simple apps or if you're new to React Native
- **Hooks (AppWithHooks.tsx)**: **Recommended** for most applications, provides clean and reusable code
- **Context (AppWithContext.tsx)**: Best for complex apps with multiple components needing scale access

---

## Example 1: Basic Approach (App.tsx)

Simple and straightforward implementation using direct service instance:

```typescript
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  FlatList,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
} from 'react-native';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
} from '@kgiton/react-native-sdk';

// ⚠️ SECURITY: Never commit real license keys to version control!
// Use environment variables for production apps.
const LICENSE_KEY = 'YOUR-LICENSE-KEY-HERE'; // Replace with your actual license key

const App = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [state, setState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Setup event handlers
    service.setEventHandlers({
      onWeightData: (data) => {
        setWeight(data);
      },
      onConnectionStateChange: (newState) => {
        setState(newState);
        if (newState === ScaleConnectionState.SCANNING) {
          setScanning(true);
        } else {
          setScanning(false);
        }
      },
      onDevicesFound: (foundDevices) => {
        setDevices(foundDevices);
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });

    // Cleanup on unmount
    return () => {
      service.dispose();
    };
  }, []);

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

      if (!allGranted) {
        Alert.alert('Permissions', 'Bluetooth permissions are required');
      }
    }
  };

  const handleScan = async () => {
    try {
      const isEnabled = await service.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert('Bluetooth', 'Please enable Bluetooth');
        return;
      }

      await service.scanForDevices(15000); // 15 seconds
    } catch (error: any) {
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleStopScan = () => {
    service.stopScan();
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const response = await service.connectWithLicenseKey(deviceId, LICENSE_KEY);
      Alert.alert('Connection', response.message);
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await service.disconnect();
      Alert.alert('Disconnected', 'Device disconnected successfully');
    } catch (error: any) {
      Alert.alert('Disconnect Error', error.message);
    }
  };

  const handleBuzzer = async (command: string) => {
    try {
      await service.triggerBuzzer(command);
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  };

  const getStateColor = () => {
    switch (state) {
      case ScaleConnectionState.AUTHENTICATED:
        return '#4CAF50';
      case ScaleConnectionState.CONNECTED:
        return '#2196F3';
      case ScaleConnectionState.CONNECTING:
        return '#FF9800';
      case ScaleConnectionState.SCANNING:
        return '#9C27B0';
      case ScaleConnectionState.ERROR:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>KGiTON Scale</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor() }]}>
          <Text style={styles.statusText}>{state.toUpperCase()}</Text>
        </View>
      </View>

      {/* Weight Display */}
      {service.isAuthenticated() && (
        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>Current Weight</Text>
          <Text style={styles.weightValue}>
            {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
          </Text>
          <Text style={styles.weightTime}>
            {weight ? new Date(weight.timestamp).toLocaleTimeString() : ''}
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!service.isConnected() ? (
          <View style={styles.buttonRow}>
            <Button
              title={scanning ? 'Stop Scan' : 'Scan Devices'}
              onPress={scanning ? handleStopScan : handleScan}
              color="#2196F3"
            />
          </View>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <Button
                title="Disconnect"
                onPress={handleDisconnect}
                color="#F44336"
              />
            </View>
            {service.isAuthenticated() && (
              <View style={styles.buzzerControls}>
                <Text style={styles.sectionTitle}>Buzzer Controls</Text>
                <View style={styles.buttonGrid}>
                  <Button
                    title="Beep"
                    onPress={() => handleBuzzer('BEEP')}
                    color="#4CAF50"
                  />
                  <Button
                    title="Buzz"
                    onPress={() => handleBuzzer('BUZZ')}
                    color="#2196F3"
                  />
                  <Button
                    title="Long"
                    onPress={() => handleBuzzer('LONG')}
                    color="#FF9800"
                  />
                  <Button
                    title="Off"
                    onPress={() => handleBuzzer('OFF')}
                    color="#757575"
                  />
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Device List */}
      {!service.isConnected() && devices.length > 0 && (
        <View style={styles.deviceList}>
          <Text style={styles.sectionTitle}>
            Found Devices ({devices.length})
          </Text>
          <FlatList
            data={devices}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.deviceItem}>
                <View style={styles.deviceInfo}>
                  <Text style={styles.deviceName}>{item.name}</Text>
                  <Text style={styles.deviceRssi}>
                    Signal: {item.rssi} dBm
                  </Text>
                  {item.licenseKey && (
                    <Text style={styles.deviceLicense}>
                      ✓ Has saved license
                    </Text>
                  )}
                </View>
                <Button
                  title="Connect"
                  onPress={() => handleConnect(item.id)}
                  color="#4CAF50"
                />
              </View>
            )}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  weightCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weightLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#333',
  },
  weightTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  controls: {
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 8,
  },
  buzzerControls: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'space-between',
  },
  deviceList: {
    flex: 1,
  },
  deviceItem: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceRssi: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
  },
  deviceLicense: {
    fontSize: 11,
    color: '#4CAF50',
    marginTop: 2,
  },
});

export default App;
```

---

## Example 2: Using React Hooks (AppWithHooks.tsx) ⭐ Recommended

Cleaner approach using custom hooks for better code organization:

```typescript
import { useKGiTONScale, useDeviceScan, useDeviceConnection, useBuzzer, useWeight } from '@kgiton/react-native-sdk';

const App = () => {
  // Main hook for service and state
  const { service, weight, devices, connectionState, isConnected, isAuthenticated } = useKGiTONScale(true);
  
  // Specialized hooks
  const { scan, stopScan, isScanning } = useDeviceScan(service, 15000);
  const { connect, disconnect } = useDeviceConnection(service);
  const { beep, buzz, longBeep, turnOff } = useBuzzer(service);
  const { display, average, history } = useWeight(weight);

  // Use the hooks for cleaner code
  await scan(); // Start scanning
  await connect(deviceId, licenseKey); // Connect
  await beep(); // Trigger buzzer
};
```

**Benefits:**
- Clean and declarative code
- Reusable hooks across components
- Automatic state management
- Better separation of concerns

See [AppWithHooks.tsx](./AppWithHooks.tsx) for complete implementation.

---

## Example 3: Using Context Provider (AppWithContext.tsx)

Global state management using React Context for component-based architecture:

```typescript
import { ScaleProvider, useScaleContext } from '@kgiton/react-native-sdk';

// Wrap your app
const App = () => {
  return (
    <ScaleProvider enableLogging={true}>
      <YourComponents />
    </ScaleProvider>
  );
};

// Use in any component
const MyComponent = () => {
  const { service, weight, isConnected } = useScaleContext();
  
  return (
    <Text>Weight: {weight?.weight.toFixed(3)} kg</Text>
  );
};
```

**Benefits:**
- Global scale service access
- Share state across multiple components
- Clean component hierarchy
- HOC support with `withScale()`

See [AppWithContext.tsx](./AppWithContext.tsx) for complete implementation.

---

## 🚀 Running the Examples

1. **Create a new React Native project:**
```bash
npx react-native init KGiTONExample
cd KGiTONExample
```

2. **Install the SDK:**
```bash
npm install @kgiton/react-native-sdk
npm install react-native-ble-plx @react-native-async-storage/async-storage
```

3. **Setup Platform Configuration:**

**iOS (ios/Info.plist):**
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Need Bluetooth to connect to scale devices</string>
```

**Android (android/app/src/main/AndroidManifest.xml):**
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

4. **Choose and use one of the examples:**
```bash
# Copy the example you want to use
cp node_modules/@kgiton/react-native-sdk/example/App.tsx ./App.tsx
# or
cp node_modules/@kgiton/react-native-sdk/example/AppWithHooks.tsx ./App.tsx
# or  
cp node_modules/@kgiton/react-native-sdk/example/AppWithContext.tsx ./App.tsx
```

5. **Run the app:**
```bash
# For iOS
cd ios && pod install && cd ..
npx react-native run-ios

# For Android
npx react-native run-android
```

---

## ✨ Features Demonstrated

All examples demonstrate:

- ✅ Bluetooth permission handling (iOS & Android)
- ✅ Device scanning and discovery with RSSI
- ✅ Connection with license key authentication
- ✅ Real-time weight data streaming (~10 Hz)
- ✅ Connection state management
- ✅ Buzzer control (BEEP, BUZZ, LONG, OFF)
- ✅ Device list with saved license keys
- ✅ Comprehensive error handling
- ✅ Modern UI with Material Design
- ✅ Weight history tracking
- ✅ Connection stability monitoring

---

## 📚 Comparison Table

| Feature | Basic | Hooks ⭐ | Context |
|---------|-------|---------|---------|
| Easy to learn | ✅ Yes | ⚠️ Medium | ⚠️ Medium |
| Code reusability | ❌ Limited | ✅ High | ✅ High |
| Component sharing | ❌ No | ⚠️ Via props | ✅ Global |
| Best for | Simple apps | Most apps | Complex apps |
| Lines of code | Most | Less | Least per component |

---

## 🎓 Learning Path

1. **Start with Basic** - Understand core concepts
2. **Move to Hooks** - Learn modern patterns (Recommended)
3. **Use Context** - For multi-component apps

---

## 📖 Next Steps

- 📘 Read the [Main README](../README.md) for complete API documentation
- 🔧 Check [Integration Guide](../docs/INTEGRATION.md) for detailed setup
- 🐛 See [Troubleshooting](../docs/TROUBLESHOOTING.md) for common issues
- 🚀 Explore [Quick Reference](../QUICKSTART.md) for quick start

---

## 💡 Tips

- Always request permissions before scanning
- Use hooks approach for cleaner code
- Save license keys to avoid re-entering
- Monitor connection state for UI updates
- Handle errors gracefully with try-catch
- Dispose service on component unmount

---

**Happy coding! 🎉**
