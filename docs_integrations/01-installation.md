# Installation Guide

This guide walks you through installing the KGiTON React Native SDK in your project.

## Prerequisites

Before installing, ensure you have:

- Node.js 14+ installed
- React Native 0.70.0 or higher
- For Android: Android SDK with API level 21+
- For iOS: Xcode 13+ and iOS 13+
- Basic knowledge of React Native and BLE concepts

## Installation Methods

### Method 1: NPM Package (Recommended)

```bash
npm install @kgiton/react-native-sdk
```

Or with Yarn:

```bash
yarn add @kgiton/react-native-sdk
```

### Method 2: GitHub Repository

Install directly from GitHub:

```bash
npm install https://github.com/kuldii/react-native-kgiton-sdk.git
```

Or specify a version/branch:

```bash
npm install https://github.com/kuldii/react-native-kgiton-sdk.git#v1.0.0
```

## Dependencies

The SDK requires the following peer dependencies:

### 1. React Native BLE PLX

```bash
npm install react-native-ble-plx
```

### 2. AsyncStorage

```bash
npm install @react-native-async-storage/async-storage
```

## Platform Setup

### Android Configuration

1. **Update `android/build.gradle`:**

```gradle
buildscript {
    ext {
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
    }
}
```

2. **Update `android/app/src/main/AndroidManifest.xml`:**

```xml
<manifest>
    <!-- Bluetooth permissions -->
    <uses-permission android:name="android.permission.BLUETOOTH"/>
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>
    
    <!-- Android 12+ (API 31+) -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                     android:usesPermissionFlags="neverForLocation"/>
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>
    
    <!-- Location permission for BLE scanning -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
</manifest>
```

3. **Proguard Rules (if using Proguard):**

Add to `android/app/proguard-rules.pro`:

```proguard
-keep class com.polidea.reactnativeble.** { *; }
-dontwarn com.polidea.reactnativeble.**
```

### iOS Configuration

1. **Update `ios/Podfile`:**

```ruby
platform :ios, '13.0'

target 'YourApp' do
  # ... other dependencies
  
  pod 'react-native-ble-plx', :path => '../node_modules/react-native-ble-plx'
end

post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
    end
  end
end
```

2. **Update `ios/YourApp/Info.plist`:**

```xml
<dict>
    <!-- Bluetooth usage description -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>This app needs Bluetooth to connect to your KGiTON scale device</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>This app needs Bluetooth to communicate with your KGiTON scale device</string>
    
    <!-- Location usage (required for BLE scanning on iOS) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app needs location permission to scan for Bluetooth devices</string>
</dict>
```

3. **Install pods:**

```bash
cd ios && pod install && cd ..
```

## Verify Installation

Create a test file to verify the installation:

```typescript
import { 
  KGiTONScaleService,
  ScaleConnectionState 
} from '@kgiton/react-native-sdk';

console.log('SDK imported successfully!');
console.log('ScaleConnectionState:', ScaleConnectionState);

const service = new KGiTONScaleService(true);
console.log('Service created:', service);
```

## Post-Installation

After installation:

1. **Clean and rebuild:**

```bash
# For Android
cd android && ./gradlew clean && cd ..
npx react-native run-android

# For iOS
cd ios && pod install && cd ..
npx react-native run-ios
```

2. **Test Bluetooth availability:**

```typescript
const service = new KGiTONScaleService();
const isEnabled = await service.isBluetoothEnabled();
console.log('Bluetooth enabled:', isEnabled);
```

## Troubleshooting

### Common Issues

**Issue: `Module not found: @kgiton/react-native-sdk`**

Solution:
```bash
rm -rf node_modules
npm install
```

**Issue: `react-native-ble-plx` not linking properly**

Solution:
```bash
# For Android
cd android && ./gradlew clean
cd .. && npx react-native run-android

# For iOS
cd ios && pod deintegrate && pod install
cd .. && npx react-native run-ios
```

**Issue: Bluetooth permissions not working**

Solution: Ensure you've followed the platform-specific setup correctly and requested runtime permissions. See [Permissions Setup](./18-permissions.md).

## Next Steps

Now that you have the SDK installed:

1. Continue to [Quick Start Guide](./02-quick-start.md)
2. Review [Requirements](./03-requirements.md)
3. Check out [Example Code](../example/)

## Updating the SDK

To update to the latest version:

```bash
npm update @kgiton/react-native-sdk
```

Or for a specific version:

```bash
npm install @kgiton/react-native-sdk@1.0.0
```

## Uninstallation

If you need to remove the SDK:

```bash
npm uninstall @kgiton/react-native-sdk
```

Remember to also remove platform-specific configurations if no longer needed.
