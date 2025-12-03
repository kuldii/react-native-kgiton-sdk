# Permissions Setup Guide

Complete guide for configuring Bluetooth and location permissions on Android and iOS.

## Overview

The KGiTON SDK requires Bluetooth permissions to scan for and connect to scale devices. On Android, location permissions are also required for BLE scanning (this is an Android platform requirement, not specific to this SDK).

## Android Permissions

### Required Permissions

Android requires different permissions based on the API level:

#### Android 12+ (API 31+)

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Bluetooth LE permissions for Android 12+ -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                     android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    
    <!-- Legacy Bluetooth permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH"
                     android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"
                     android:maxSdkVersion="30" />
    
    <!-- Location permission (required for BLE scanning) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    
    <!-- Optional: For background BLE -->
    <uses-permission android:name="android.permission.ACCESS_BACKGROUND_LOCATION" />
    
</manifest>
```

#### Android 6-11 (API 23-30)

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Bluetooth permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    
    <!-- Location permission (required for BLE scanning) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
    
</manifest>
```

#### Android 5 (API 21-22)

```xml
<!-- AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    
    <!-- Bluetooth permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    
</manifest>
```

### Runtime Permission Requests

For Android 6.0+ (API 23+), you must request permissions at runtime:

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

export const requestAndroidPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 12+ (API 31+)
  if (Platform.Version >= 31) {
    const granted = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    ]);

    return (
      granted['android.permission.BLUETOOTH_SCAN'] === 
        PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.BLUETOOTH_CONNECT'] === 
        PermissionsAndroid.RESULTS.GRANTED &&
      granted['android.permission.ACCESS_FINE_LOCATION'] === 
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  // Android 6-11 (API 23-30)
  if (Platform.Version >= 23) {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'This app needs location access to scan for Bluetooth devices',
        buttonNeutral: 'Ask Me Later',
        buttonNegative: 'Cancel',
        buttonPositive: 'OK',
      }
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  }

  // Android 5 (API 21-22) - No runtime permissions needed
  return true;
};
```

### Best Practices for Android

1. **Request permissions early**: Request before attempting to scan
2. **Explain why**: Use clear permission rationales
3. **Handle denials gracefully**: Provide fallback UI or instructions
4. **Check permissions before operations**: Always verify before BLE operations

```typescript
const handleScan = async () => {
  const hasPermissions = await requestAndroidPermissions();
  
  if (!hasPermissions) {
    Alert.alert(
      'Permissions Required',
      'This app needs Bluetooth and location permissions to scan for devices. Please grant them in Settings.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
    return;
  }

  // Proceed with scanning
  await service.scanForDevices();
};
```

## iOS Permissions

### Required Info.plist Entries

Add these entries to `ios/YourApp/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Bluetooth usage descriptions -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>This app needs Bluetooth to connect to your KGiTON scale device and receive weight measurements</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>This app needs Bluetooth to communicate with your KGiTON scale device</string>
    
    <!-- Location usage (required for BLE scanning) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs location permission to scan for nearby Bluetooth devices</string>
    
    <!-- Optional: For background BLE -->
    <key>NSLocationAlwaysAndWhenInUseUsageDescription</key>
    <string>This app needs location access to maintain Bluetooth connection in the background</string>
    
    <key>UIBackgroundModes</key>
    <array>
        <string>bluetooth-central</string>
    </array>
</dict>
</plist>
```

### Permission Descriptions Best Practices

iOS requires clear, user-friendly descriptions:

✅ **Good:**
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>We use Bluetooth to connect to your scale device and receive real-time weight measurements</string>
```

❌ **Bad:**
```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Bluetooth is required</string>
```

### iOS Permission Flow

iOS automatically requests permissions when you first access Bluetooth:

```typescript
// iOS automatically prompts when you call:
await service.scanForDevices();
```

No manual permission request is needed on iOS. The system will show the permission dialog with your `Info.plist` descriptions.

### Background Modes (Optional)

If your app needs to maintain BLE connection in the background:

1. In Xcode, go to **Signing & Capabilities**
2. Add **Background Modes** capability
3. Enable **Uses Bluetooth LE accessories**

Or add to `Info.plist`:

```xml
<key>UIBackgroundModes</key>
<array>
    <string>bluetooth-central</string>
</array>
```

## Permission States

### Checking Permission Status

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const checkPermissions = async (): Promise<{
  granted: boolean;
  message: string;
}> => {
  if (Platform.OS === 'ios') {
    // iOS handles permissions automatically
    return { granted: true, message: 'iOS manages permissions automatically' };
  }

  // Android
  if (Platform.Version >= 31) {
    const bluetoothScan = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
    );
    const bluetoothConnect = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    );
    const location = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    const granted = bluetoothScan && bluetoothConnect && location;
    return {
      granted,
      message: granted 
        ? 'All permissions granted'
        : 'Some permissions missing'
    };
  }

  const location = await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );

  return {
    granted: location,
    message: location 
      ? 'Location permission granted'
      : 'Location permission required'
  };
};
```

## Common Permission Issues

### Issue: "Location permission required" on Android

**Cause**: Android requires location permission for BLE scanning (privacy protection)

**Solution**: Request `ACCESS_FINE_LOCATION` permission

```typescript
await PermissionsAndroid.request(
  PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
);
```

### Issue: "Bluetooth permission denied" on Android 12+

**Cause**: New Bluetooth permissions not requested

**Solution**: Request `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`

```typescript
await PermissionsAndroid.requestMultiple([
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
  PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
]);
```

### Issue: iOS permission prompt doesn't show

**Cause**: Missing `Info.plist` entries

**Solution**: Add all required `NS*UsageDescription` keys to `Info.plist`

### Issue: "This app has crashed" on permission denial

**Cause**: App doesn't handle permission denial

**Solution**: Always check permission results before proceeding:

```typescript
const granted = await requestPermissions();
if (!granted) {
  // Show error UI, don't proceed
  return;
}
```

## Complete Permission Setup Component

```typescript
import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  Button, 
  Alert, 
  PermissionsAndroid, 
  Platform,
  Linking 
} from 'react-native';

const PermissionSetup = ({ onPermissionsGranted }) => {
  const [permissionStatus, setPermissionStatus] = useState({
    granted: false,
    checking: true,
  });

  useEffect(() => {
    checkAndRequestPermissions();
  }, []);

  const checkAndRequestPermissions = async () => {
    setPermissionStatus({ granted: false, checking: true });

    if (Platform.OS === 'ios') {
      setPermissionStatus({ granted: true, checking: false });
      onPermissionsGranted();
      return;
    }

    // Android
    try {
      const granted = await requestAndroidPermissions();
      setPermissionStatus({ granted, checking: false });
      
      if (granted) {
        onPermissionsGranted();
      }
    } catch (error) {
      console.error('Permission error:', error);
      setPermissionStatus({ granted: false, checking: false });
    }
  };

  const requestAndroidPermissions = async () => {
    if (Platform.Version >= 31) {
      const result = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      return Object.values(result).every(
        (status) => status === PermissionsAndroid.RESULTS.GRANTED
      );
    }

    const result = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  };

  const openSettings = () => {
    Linking.openSettings();
  };

  if (permissionStatus.checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Checking permissions...</Text>
      </View>
    );
  }

  if (!permissionStatus.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>
          Permissions Required
        </Text>
        <Text style={{ textAlign: 'center', marginBottom: 20 }}>
          This app needs Bluetooth and location permissions to scan for and 
          connect to scale devices.
        </Text>
        <Button
          title="Grant Permissions"
          onPress={checkAndRequestPermissions}
        />
        <Button
          title="Open Settings"
          onPress={openSettings}
        />
      </View>
    );
  }

  return null;
};

export default PermissionSetup;
```

## Testing Permissions

### Android Testing

1. **Install app** on physical device
2. **Go to Settings** → Apps → Your App → Permissions
3. **Verify** Bluetooth and Location permissions are listed
4. **Test** by toggling permissions on/off

### iOS Testing

1. **Install app** on physical device
2. **First scan** should trigger permission prompt
3. **Go to Settings** → Privacy → Bluetooth → Your App
4. **Verify** permission is granted

## Summary Checklist

### Android Setup
- [ ] Add permissions to `AndroidManifest.xml`
- [ ] Set `minSdkVersion` to 21 or higher
- [ ] Request runtime permissions for API 23+
- [ ] Handle permission denials gracefully
- [ ] Test on physical device with different Android versions

### iOS Setup
- [ ] Add usage descriptions to `Info.plist`
- [ ] Ensure descriptions are user-friendly
- [ ] Add background modes if needed
- [ ] Test on physical device
- [ ] Verify permission prompts appear

### Both Platforms
- [ ] Test permission flow on physical devices
- [ ] Handle "Never Ask Again" scenarios
- [ ] Provide clear instructions to users
- [ ] Link to Settings for manual permission grants

## Next Steps

- Continue to [Quick Start Guide](./02-quick-start.md)
- Review [Troubleshooting](./19-troubleshooting.md) for permission issues
- See [Platform Setup Documentation](./20-android-setup.md) for more details
