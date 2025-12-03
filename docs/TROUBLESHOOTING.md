# Troubleshooting Guide

Common issues and solutions when using KGiTON React Native SDK.

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Permission Issues](#permission-issues)
3. [Connection Issues](#connection-issues)
4. [Data Issues](#data-issues)
5. [Platform-Specific Issues](#platform-specific-issues)

## Installation Issues

### Issue: Module not found

**Error:**
```
Module '@kgiton/react-native-sdk' not found
```

**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules
npm install
# or
yarn install

# For iOS
cd ios && pod install && cd ..

# Restart Metro bundler
npm start -- --reset-cache
```

### Issue: Peer dependency warnings

**Error:**
```
warning " > @kgiton/react-native-sdk@1.0.0" has unmet peer dependency "react-native-ble-plx"
```

**Solution:**
```bash
npm install react-native-ble-plx @react-native-async-storage/async-storage
```

### Issue: CocoaPods error on iOS

**Error:**
```
[!] CocoaPods could not find compatible versions for pod "react-native-ble-plx"
```

**Solution:**
```bash
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..
```

## Permission Issues

### Issue: Bluetooth permissions not granted on Android 12+

**Error:**
```
BLEConnectionException: Bluetooth permissions not granted
```

**Solution:**

1. Check AndroidManifest.xml has all required permissions:
```xml
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

2. Request permissions at runtime:
```typescript
import { PermissionsAndroid, Platform } from 'react-native';

if (Platform.OS === 'android' && Platform.Version >= 31) {
  await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ]);
}
```

### Issue: Location permission denied on Android

**Error:**
```
Scanning requires location permission
```

**Solution:**

Location permission is required for BLE scanning on Android:

```typescript
const hasLocationPermission = await PermissionsAndroid.check(
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
);

if (!hasLocationPermission) {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
  
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert(
      'Location Required',
      'This app needs location permission to scan for Bluetooth devices'
    );
  }
}
```

### Issue: Bluetooth usage description missing on iOS

**Error:**
```
This app has crashed because it attempted to access privacy-sensitive data without a usage description
```

**Solution:**

Add to `ios/YourApp/Info.plist`:
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app needs Bluetooth to connect to scale devices</string>
<key>NSBluetoothPeripheralUsageDescription</key>
<string>This app needs Bluetooth to connect to scale devices</string>
```

## Connection Issues

### Issue: Device not found during scan

**Symptoms:**
- Scan completes but no devices found
- Device shows up in other apps but not in yours

**Solutions:**

1. **Check Bluetooth is enabled:**
```typescript
const isEnabled = await service.isBluetoothEnabled();
if (!isEnabled) {
  Alert.alert('Bluetooth', 'Please enable Bluetooth');
}
```

2. **Check device name:**
```typescript
// Device must have "KGiTON" in its name
// Check your ESP32 firmware for correct device name
```

3. **Increase scan timeout:**
```typescript
// Try longer scan duration
await service.scanForDevices(30000); // 30 seconds
```

4. **Check device is not connected to another device:**
- Only one connection at a time is supported
- Disconnect from other apps first

### Issue: Connection timeout

**Error:**
```
BLEConnectionException: Connection timeout
```

**Solutions:**

1. **Device too far away:**
- Move device closer to phone
- Check RSSI value (should be > -80 dBm)

2. **Retry connection:**
```typescript
const maxRetries = 3;
let connected = false;

for (let i = 0; i < maxRetries && !connected; i++) {
  try {
    await service.connectWithLicenseKey(deviceId, licenseKey);
    connected = true;
  } catch (error) {
    console.log(`Retry ${i + 1}/${maxRetries}`);
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}
```

3. **Reset Bluetooth:**
```typescript
// Ask user to toggle Bluetooth off and on
Alert.alert(
  'Connection Issue',
  'Please toggle Bluetooth off and on, then try again'
);
```

### Issue: License key invalid

**Error:**
```
LicenseKeyException: License key tidak valid
```

**Solutions:**

1. **Check license key format:**
```typescript
// Valid format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (5 groups of 5 characters)
const licenseKey = 'YOUR-LICENSE-KEY-HERE';
```

2. **Verify license key with PT KGiTON:**
- Contact support@kgiton.com
- Ensure license is active and not expired
- Verify key matches your device/app registration

3. **Check for typos and use secure storage:**
```typescript
// ✅ RECOMMENDED: Use environment variables
import Config from 'react-native-config';
const LICENSE_KEY = Config.KGITON_LICENSE_KEY;

// ❌ AVOID: Hardcoding keys in source code
const LICENSE_KEY = 'actual-key-here'; // Never do this!
```

### Issue: Automatic disconnection

**Symptoms:**
- Connected but disconnects after a few seconds
- Connection state changes to disconnected unexpectedly

**Solutions:**

1. **Check authentication:**
```typescript
// Make sure license key is correct
// Device auto-disconnects if authentication fails
```

2. **Monitor connection stability:**
```typescript
service.setEventHandlers({
  onConnectionStateChange: (state) => {
    console.log('State changed:', state);
    if (state === ScaleConnectionState.ERROR) {
      // Check error and retry
    }
  },
});
```

3. **Prevent phone from sleeping:**
```typescript
import KeepAwake from 'react-native-keep-awake';

// Keep screen on during operation
KeepAwake.activate();
```

## Data Issues

### Issue: No weight data received

**Symptoms:**
- Connected and authenticated
- `onWeightData` event never fires

**Solutions:**

1. **Check scale is sending data:**
- Verify ESP32 is sending data via TX characteristic
- Check Serial monitor on ESP32 for data transmission

2. **Verify authentication:**
```typescript
if (service.isAuthenticated()) {
  console.log('Ready to receive data');
} else {
  console.log('Not authenticated yet');
}
```

3. **Check characteristic UUID:**
```typescript
// Verify ESP32 firmware uses correct UUID
// TX Characteristic: abcd1234-1234-1234-1234-123456789abc
```

### Issue: Invalid weight values

**Symptoms:**
- Receiving weight data but values are incorrect
- NaN or null values

**Solutions:**

1. **Check data format:**
```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    console.log('Raw weight:', data.weight);
    console.log('Type:', typeof data.weight);
    
    if (isNaN(data.weight)) {
      console.error('Invalid weight data received');
    }
  },
});
```

2. **Verify ESP32 data format:**
```cpp
// ESP32 should send: "123.456" (float as string)
// NOT: "123.456 kg" or other formats
```

3. **Add data validation:**
```typescript
import { DataValidation } from '@kgiton/react-native-sdk';

service.setEventHandlers({
  onWeightData: (data) => {
    if (data.weight >= 0 && data.weight < 9999) {
      // Valid weight
      setWeight(data);
    } else {
      console.warn('Weight out of range:', data.weight);
    }
  },
});
```

### Issue: Delayed weight updates

**Symptoms:**
- Weight data arrives but with noticeable delay
- Update frequency is slow

**Solutions:**

1. **Check BLE connection interval:**
```typescript
// Connection interval is determined by OS
// iOS: typically 30ms
// Android: varies by device (15-30ms)
```

2. **Reduce processing in event handler:**
```typescript
// Bad: Heavy processing in event handler
service.setEventHandlers({
  onWeightData: (data) => {
    // Don't do heavy calculations here
    processComplexData(data); // ❌
  },
});

// Good: Defer processing
service.setEventHandlers({
  onWeightData: (data) => {
    setWeight(data); // Quick state update
    // Process later if needed
  },
});
```

## Platform-Specific Issues

### iOS Issues

#### Issue: Background scanning not working

**Solution:**

Add background mode capability:
```xml
<!-- ios/YourApp/Info.plist -->
<key>UIBackgroundModes</key>
<array>
    <string>bluetooth-central</string>
</array>
```

Note: iOS has strict limitations on background BLE operations.

#### Issue: Connection drops when app backgrounds

**Solution:**
```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (nextAppState) => {
    if (nextAppState === 'active') {
      // Reconnect if needed
      if (!service.isConnected()) {
        reconnect();
      }
    }
  });

  return () => subscription.remove();
}, []);
```

### Android Issues

#### Issue: Scan not working on Android 12+

**Solution:**

Must request `BLUETOOTH_SCAN` permission:
```typescript
if (Platform.OS === 'android' && Platform.Version >= 31) {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    {
      title: 'Bluetooth Scan Permission',
      message: 'This app needs Bluetooth scan permission',
      buttonPositive: 'OK',
    }
  );
}
```

#### Issue: Service UUID not found on some Android devices

**Solution:**
```typescript
// Some Android devices require service UUID in lowercase
// SDK handles this automatically, but verify in logs

// If issue persists, try manual discovery:
const services = await device.services();
console.log('Available services:', services.map(s => s.uuid));
```

## Debugging Tips

### Enable Verbose Logging

```typescript
// Enable detailed logging
const service = new KGiTONScaleService(true);

// Monitor all events
service.setEventHandlers({
  onWeightData: (data) => console.log('Weight:', data),
  onConnectionStateChange: (state) => console.log('State:', state),
  onDevicesFound: (devices) => console.log('Devices:', devices),
  onError: (error) => console.error('Error:', error),
});
```

### Check BLE Manager State

```typescript
import { BleManager } from 'react-native-ble-plx';

const checkBLE = async () => {
  const manager = new BleManager();
  const state = await manager.state();
  console.log('BLE State:', state);
  // States: Unknown, Resetting, Unsupported, Unauthorized, PoweredOff, PoweredOn
};
```

### Test with Sample Data

```typescript
// Simulate weight data for testing without device
const testWeight = {
  weight: 75.5,
  timestamp: new Date(),
  unit: 'kg',
};

// Test your UI with mock data
setWeight(testWeight);
```

## Getting Help

If you're still experiencing issues:

1. **Check Documentation:**
   - [README.md](../README.md)
   - [INTEGRATION.md](INTEGRATION.md)
   - [API Reference](../README.md#api-reference)

2. **Contact Support:**
   - Email: support@kgiton.com
   - Include: SDK version, platform, OS version, error logs

3. **Report Bugs:**
   - GitHub Issues: https://github.com/kuldii/react-native-kgiton-sdk/issues
   - Provide: Minimal reproduction example

## Diagnostic Checklist

Before contacting support, check:

- [ ] SDK version is latest
- [ ] Permissions granted
- [ ] Bluetooth enabled
- [ ] Device in range (RSSI > -80)
- [ ] Valid license key
- [ ] Correct UUID in ESP32 firmware
- [ ] No other app connected to device
- [ ] Logs show detailed error messages

---

© 2025 PT KGiTON. All rights reserved.
