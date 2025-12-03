# Troubleshooting Guide

Common issues and solutions when using the KGiTON SDK.

## Overview

This guide helps you diagnose and resolve common problems encountered when integrating and using the KGiTON BLE Scale SDK.

---

## Connection Issues

### Device Not Found During Scan

**Symptoms:**
- Scan completes but no devices found
- Device list is empty after scanning

**Possible Causes:**
1. Bluetooth not enabled
2. Missing permissions
3. Device too far away
4. Device already connected to another app

**Solutions:**

```typescript
// 1. Check Bluetooth state
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();
const state = await manager.state();

if (state !== 'PoweredOn') {
  Alert.alert('Bluetooth Off', 'Please enable Bluetooth');
}

// 2. Verify permissions
import { PermissionsAndroid, Platform } from 'react-native';

if (Platform.OS === 'android' && Platform.Version >= 31) {
  const granted = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
  ]);
  
  console.log('Permissions:', granted);
}

// 3. Increase scan timeout
await service.scanForDevices(30000); // 30 seconds

// 4. Check device is powered on and not connected elsewhere
// Restart the scale device
```

### Cannot Connect to Device

**Symptoms:**
- Connection attempt times out
- "Connection failed" error

**Solutions:**

```typescript
// 1. Ensure device is in range
// Move closer to device (within 5 meters)

// 2. Stop other scans
service.stopScan();
await new Promise(resolve => setTimeout(resolve, 1000));

// 3. Retry connection
const retryConnect = async (deviceId: string, licenseKey: string, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await service.connectWithLicenseKey(deviceId, licenseKey);
      return response;
    } catch (error) {
      console.log(`Attempt ${i + 1} failed`);
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }
  throw new Error('Connection failed after retries');
};

// 4. Check device isn't already connected
if (service.isDeviceConnected()) {
  await service.disconnect();
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Frequent Disconnections

**Symptoms:**
- Connection drops every few minutes
- "Device disconnected" events

**Solutions:**

```typescript
// 1. Check signal strength
service.on('deviceDiscovered', (device) => {
  if (device.rssi < -85) {
    console.warn('Weak signal:', device.rssi);
  }
});

// 2. Move closer to device

// 3. Implement auto-reconnect
service.on('disconnected', async () => {
  console.log('Disconnected, attempting reconnect...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    await service.connectWithLicenseKey(deviceId, licenseKey);
  } catch (error) {
    console.error('Reconnection failed:', error);
  }
});

// 4. Check battery level
// Low battery can cause unstable connections

// 5. Reduce interference
// Move away from other wireless devices
// Avoid areas with many Bluetooth devices
```

---

## Authentication Issues

### Invalid License Key Format

**Symptoms:**
- "Invalid license format" error
- Authentication fails immediately

**Solutions:**

```typescript
// Validate format before connecting
const validateLicenseKey = (key: string): boolean => {
  // Format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX (29 characters with dashes)
  const pattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  return pattern.test(key);
};

const licenseKey = 'ABCDE-12345-FGHIJ-67890-KLMNO';

if (!validateLicenseKey(licenseKey)) {
  Alert.alert('Invalid License', 'Please check your license key format');
  return;
}

await service.connectWithLicenseKey(deviceId, licenseKey);
```

### License Key Not Recognized

**Symptoms:**
- "License not found" error
- Authentication succeeds but connection fails

**Solutions:**

```typescript
// 1. Verify license key is correct
// Contact KGiTON support if needed

// 2. Check device firmware version
// Older firmware may not recognize new licenses

// 3. Try alternative connection method
try {
  // Method 1: Connect with license
  await service.connectWithLicenseKey(deviceId, licenseKey);
} catch (error) {
  // Method 2: Connect then authenticate
  await service.connectToDevice(deviceId);
  await service.authenticateDevice(licenseKey);
}
```

---

## Data Issues

### No Weight Data Received

**Symptoms:**
- Connected successfully
- No weight events triggered
- Weight value is always null

**Solutions:**

```typescript
// 1. Verify event listener is set up
service.on('weight', (data) => {
  console.log('Weight received:', data);
});

// 2. Check connection is authenticated
if (!service.isAuthenticated()) {
  console.error('Not authenticated');
}

// 3. Verify device is sending data
// Place object on scale to trigger weight reading

// 4. Check for errors
service.on('error', (error) => {
  console.error('SDK Error:', error);
});

// 5. Enable debug logging
if (__DEV__) {
  service.setDebugLogging(true);
}
```

### Inaccurate Weight Readings

**Symptoms:**
- Weight values fluctuate wildly
- Readings don't match physical weight

**Solutions:**

```typescript
// 1. Calibrate the scale
// Follow manufacturer instructions

// 2. Filter invalid readings
service.on('weight', (data) => {
  if (data.weight < 0 || data.weight > 500) {
    console.warn('Invalid weight:', data.weight);
    return;
  }
  
  // Use valid weight
  setWeight(data);
});

// 3. Average multiple readings
const readings: number[] = [];

service.on('weight', (data) => {
  readings.push(data.weight);
  
  if (readings.length >= 5) {
    const average = readings.reduce((a, b) => a + b, 0) / readings.length;
    console.log('Average weight:', average);
    readings.length = 0; // Reset
  }
});

// 4. Place scale on stable surface
// Ensure scale is level and stable
```

---

## Permission Issues

### Android 12+ Permission Denied

**Symptoms:**
- Scan fails with "Permission denied"
- App crashes on scan

**Solutions:**

```typescript
// AndroidManifest.xml - Add these permissions
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                 android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />

// Request permissions at runtime
import { PermissionsAndroid, Platform } from 'react-native';

const requestPermissions = async () => {
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
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );

      return granted === PermissionsAndroid.RESULTS.GRANTED;
    }
  }
  
  return true; // iOS handles via Info.plist
};

// Always request before scanning
const hasPermission = await requestPermissions();

if (!hasPermission) {
  Alert.alert(
    'Permission Required',
    'Bluetooth permission is required to scan for devices',
    [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Settings', onPress: () => Linking.openSettings() }
    ]
  );
  return;
}

await service.scanForDevices();
```

### iOS Permission Denied

**Symptoms:**
- Scan doesn't start
- No permission dialog shown

**Solutions:**

```xml
<!-- ios/YourApp/Info.plist -->
<dict>
  <key>NSBluetoothAlwaysUsageDescription</key>
  <string>This app needs Bluetooth to connect to scale devices</string>
  
  <key>NSBluetoothPeripheralUsageDescription</key>
  <string>This app needs Bluetooth to communicate with scale devices</string>
</dict>
```

```bash
# After updating Info.plist
cd ios && pod install && cd ..
npm run ios
```

---

## Build Issues

### Android Build Fails

**Symptoms:**
- Gradle build errors
- "Could not resolve dependency" errors

**Solutions:**

```gradle
// android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
}

// android/app/build.gradle
android {
    compileSdkVersion rootProject.ext.compileSdkVersion
    
    defaultConfig {
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
    }
}

dependencies {
    implementation "com.facebook.react:react-native:+"
    // SDK dependencies are automatically included
}
```

```bash
# Clean and rebuild
cd android
./gradlew clean
cd ..
npm run android
```

### iOS Build Fails

**Symptoms:**
- CocoaPods errors
- "Framework not found" errors

**Solutions:**

```bash
# 1. Clean CocoaPods cache
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod install
cd ..

# 2. Clean Xcode build
cd ios
xcodebuild clean
cd ..

# 3. Rebuild
npm run ios
```

---

## Runtime Issues

### App Crashes on Startup

**Symptoms:**
- App crashes immediately after launch
- Red screen error

**Solutions:**

```typescript
// 1. Add Error Boundary
import { ErrorBoundary } from 'react-error-boundary';

const App = () => (
  <ErrorBoundary
    fallback={<Text>Something went wrong</Text>}
    onError={(error) => console.error(error)}
  >
    <YourApp />
  </ErrorBoundary>
);

// 2. Check for initialization errors
try {
  const service = new KGiTONScaleService();
} catch (error) {
  console.error('Service initialization failed:', error);
}

// 3. Verify all dependencies installed
npm install

// 4. Clear cache
npm start -- --reset-cache
```

### Memory Leaks

**Symptoms:**
- App becomes slow over time
- Memory usage increases

**Solutions:**

```typescript
// 1. Always cleanup event listeners
useEffect(() => {
  const handleWeight = (data) => {
    console.log(data);
  };

  service.on('weight', handleWeight);

  return () => {
    service.off('weight', handleWeight); // IMPORTANT!
  };
}, []);

// 2. Dispose service when unmounting
useEffect(() => {
  return () => {
    service.dispose();
  };
}, []);

// 3. Don't create multiple service instances
// ❌ BAD
const Component = () => {
  const service = new KGiTONScaleService(); // Creates new instance every render
};

// ✅ GOOD
const Component = () => {
  const { service } = useKGiTONScale(); // Single instance
};
```

---

## Performance Issues

### Slow Scanning

**Symptoms:**
- Scan takes too long
- App freezes during scan

**Solutions:**

```typescript
// 1. Reduce scan timeout
await service.scanForDevices(10000); // 10 seconds instead of 15

// 2. Stop scan when device found
service.on('deviceDiscovered', (device) => {
  if (device.id === targetDeviceId) {
    service.stopScan();
  }
});

// 3. Scan in background
const scanInBackground = async () => {
  // Show loading indicator
  setScanning(true);
  
  try {
    const devices = await service.scanForDevices(15000);
    // Process devices
  } finally {
    setScanning(false);
  }
};
```

### High Battery Drain

**Symptoms:**
- Device battery drains quickly
- App consumes excessive power

**Solutions:**

```typescript
// 1. Stop scanning when not needed
if (isConnected) {
  service.stopScan();
}

// 2. Disconnect when app backgrounds
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'background') {
    service.disconnect();
  }
});

// 3. Reduce weight update frequency
const throttledWeightHandler = throttle((data) => {
  setWeight(data);
}, 500); // Update max once per 500ms

service.on('weight', throttledWeightHandler);
```

---

## Debugging Tips

### Enable Debug Logging

```typescript
if (__DEV__) {
  service.setDebugLogging(true);
}

// Check logs in Metro bundler console
// Or use React Native Debugger
```

### Check BLE Manager State

```typescript
import { BleManager } from 'react-native-ble-plx';

const manager = new BleManager();

// Check state
const state = await manager.state();
console.log('BLE State:', state);

// Listen to state changes
manager.onStateChange((state) => {
  console.log('BLE State changed to:', state);
}, true);
```

### Test on Real Device

```typescript
// BLE doesn't work on simulators/emulators
// Always test on physical devices

// Android: Connect via USB and run
npm run android

// iOS: Select physical device in Xcode and run
npm run ios
```

### Verify Service UUID

```typescript
// If using custom service UUID
const SERVICE_UUID = 'your-service-uuid';
const devices = await service.scanForDevices(15000);

devices.forEach(device => {
  console.log('Device:', device.id);
  console.log('Services:', device.serviceUUIDs);
});
```

---

## Common Error Messages

### "BLE is not enabled"

**Solution:**
```typescript
// Prompt user to enable Bluetooth
Alert.alert(
  'Bluetooth Required',
  'Please enable Bluetooth to use this app',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Enable', onPress: () => {
      // On Android, can request to enable
      // On iOS, user must enable manually
    }}
  ]
);
```

### "Device not found"

**Solution:**
```typescript
// 1. Ensure device is powered on
// 2. Move closer to device
// 3. Restart device
// 4. Clear Bluetooth cache (Android Settings)
```

### "Connection timeout"

**Solution:**
```typescript
// Increase timeout
await service.connectWithLicenseKey(deviceId, licenseKey, {
  timeout: 30000 // 30 seconds
});
```

### "Authentication failed"

**Solution:**
```typescript
// 1. Verify license key
// 2. Check device firmware version
// 3. Contact support for license validation
```

---

## Getting Help

### Check Documentation

- [Installation Guide](./02-installation.md)
- [Quick Start](./02-quick-start.md)
- [API Reference](./07-api-service.md)
- [Error Handling](./11-error-handling.md)

### Enable Logging

```typescript
service.setDebugLogging(true);

service.on('debug', (message) => {
  console.log('[SDK Debug]', message);
});

service.on('error', (error) => {
  console.error('[SDK Error]', error);
});
```

### Collect Diagnostic Info

```typescript
const getDiagnostics = async () => {
  const info = {
    platform: Platform.OS,
    version: Platform.Version,
    bleState: await manager.state(),
    isConnected: service.isDeviceConnected(),
    connectionState: service.getConnectionState(),
    lastError: service.getLastError(),
  };
  
  console.log('Diagnostics:', JSON.stringify(info, null, 2));
  return info;
};
```

### Contact Support

If issues persist:
- Email: support@kgiton.com
- Include: Error logs, device info, steps to reproduce
- Provide: Code snippets if possible

---

## See Also

- [Android Setup](./20-android-setup.md)
- [iOS Setup](./21-ios-setup.md)
- [Error Handling](./11-error-handling.md)
- [Connection Stability](./12-connection-stability.md)
