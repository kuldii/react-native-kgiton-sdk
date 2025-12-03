# iOS Setup Guide

Complete guide for iOS-specific configuration and setup.

## Overview

This guide covers all iOS-specific requirements, permissions, and configurations needed to integrate the KGiTON SDK.

---

## Requirements

- **macOS**: Monterey (12.0) or later
- **Xcode**: 14.0 or later
- **iOS Deployment Target**: 13.0 or higher
- **CocoaPods**: 1.11.0 or later
- **Swift**: 5.0 or later (for Swift projects)

---

## Installation

### 1. Install CocoaPods

```bash
# Install CocoaPods if not already installed
sudo gem install cocoapods

# Update CocoaPods
pod repo update
```

### 2. Install Dependencies

```bash
# Install npm packages
npm install @kgiton/react-native-sdk

# Install pods
cd ios
pod install
cd ..
```

---

## Xcode Configuration

### 1. Open Workspace

```bash
# Always open .xcworkspace, NOT .xcodeproj
open ios/YourApp.xcworkspace
```

### 2. Configure Deployment Target

In Xcode:
1. Select your project in the Project Navigator
2. Select your app target
3. Go to **General** tab
4. Set **Minimum Deployments** to iOS 13.0 or higher

### 3. Configure Signing

1. Go to **Signing & Capabilities** tab
2. Select your **Team**
3. Ensure **Automatically manage signing** is checked
4. Or configure manual signing with provisioning profiles

---

## Info.plist Configuration

### Required Permissions

Add these keys to `ios/YourApp/Info.plist`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Your existing keys -->

    <!-- Bluetooth Permissions -->
    <key>NSBluetoothAlwaysUsageDescription</key>
    <string>This app needs Bluetooth to connect to scale devices for weighing operations</string>
    
    <key>NSBluetoothPeripheralUsageDescription</key>
    <string>This app needs Bluetooth to communicate with scale devices</string>

    <!-- Optional: if you need background BLE -->
    <key>UIBackgroundModes</key>
    <array>
        <string>bluetooth-central</string>
    </array>

    <!-- Privacy - Location (only if needed for Android compatibility) -->
    <key>NSLocationWhenInUseUsageDescription</key>
    <string>This app uses Bluetooth to connect to nearby devices</string>

</dict>
</plist>
```

### Description Guidelines

Make descriptions clear and specific:

```xml
<!-- ✅ GOOD - Clear and specific -->
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app connects to KGiTON scale devices via Bluetooth to receive real-time weight measurements</string>

<!-- ❌ BAD - Too vague -->
<key>NSBluetoothAlwaysUsageDescription</key>
<string>This app uses Bluetooth</string>
```

---

## Capabilities Configuration

### 1. Enable Background Modes (Optional)

If you need to maintain connection in background:

1. Select your target in Xcode
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Add **Background Modes**
5. Check **Uses Bluetooth LE accessories**

### 2. Add to Info.plist

```xml
<key>UIBackgroundModes</key>
<array>
    <string>bluetooth-central</string>
</array>
```

---

## Podfile Configuration

### Basic Configuration

```ruby
# ios/Podfile
require_relative '../node_modules/react-native/scripts/react_native_pods'
require_relative '../node_modules/@react-native-community/cli-platform-ios/native_modules'

platform :ios, '13.0'

target 'YourApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
    :fabric_enabled => false,
  )

  # KGiTON SDK dependencies (automatically included)
  # No manual pod additions needed

  target 'YourAppTests' do
    inherit! :complete
  end

  post_install do |installer|
    react_native_post_install(installer)
    
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
      end
    end
  end
end
```

### Advanced Configuration

```ruby
# ios/Podfile
platform :ios, '13.0'
install! 'cocoapods', :deterministic_uuids => false

target 'YourApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true,
  )

  # Disable Flipper for release builds
  use_flipper!({ 'Flipper' => '0.174.0' }) if ENV['CONFIGURATION'] == 'Debug'

  post_install do |installer|
    react_native_post_install(installer)

    # Fix for Xcode 14+
    installer.pods_project.targets.each do |target|
      target.build_configurations.each do |config|
        config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
        
        # Exclude arm64 for simulator (if needed for older libs)
        config.build_settings["EXCLUDED_ARCHS[sdk=iphonesimulator*]"] = "arm64"
      end
    end
  end
end
```

---

## Build Settings

### Disable Bitcode

Bitcode is deprecated and not needed:

1. In Xcode, select your target
2. Go to **Build Settings**
3. Search for "Bitcode"
4. Set **Enable Bitcode** to **No**

Or in `Podfile`:

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      config.build_settings['ENABLE_BITCODE'] = 'NO'
    end
  end
end
```

### Other Important Settings

```ruby
post_install do |installer|
  installer.pods_project.targets.each do |target|
    target.build_configurations.each do |config|
      # Deployment target
      config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '13.0'
      
      # Disable bitcode
      config.build_settings['ENABLE_BITCODE'] = 'NO'
      
      # Swift version
      config.build_settings['SWIFT_VERSION'] = '5.0'
      
      # Optimize for size
      config.build_settings['GCC_OPTIMIZATION_LEVEL'] = 's'
    end
  end
end
```

---

## Permission Handling in Code

### Check Bluetooth Authorization

```typescript
// utils/iosPermissions.ts
import { Platform } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

export const checkiOSBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  const manager = new BleManager();
  const state = await manager.state();

  return state === 'PoweredOn';
};

export const requestiOSBluetoothPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'ios') {
    return true;
  }

  try {
    const manager = new BleManager();
    
    // On iOS, permission dialog shows automatically when scanning
    // Just need to check if Bluetooth is enabled
    const state = await manager.state();

    if (state === 'PoweredOff') {
      Alert.alert(
        'Bluetooth Off',
        'Please enable Bluetooth in Settings to use this feature.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    if (state === 'Unauthorized') {
      Alert.alert(
        'Bluetooth Permission Required',
        'Please enable Bluetooth permission in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() }
        ]
      );
      return false;
    }

    return state === 'PoweredOn';
  } catch (error) {
    console.error('Bluetooth permission check failed:', error);
    return false;
  }
};
```

### Usage in App

```typescript
// App.tsx
import { requestiOSBluetoothPermission } from './utils/iosPermissions';

const App = () => {
  const handleScan = async () => {
    const hasPermission = await requestiOSBluetoothPermission();
    
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Cannot scan without Bluetooth enabled');
      return;
    }

    await service.scanForDevices(15000);
  };

  return <YourApp />;
};
```

---

## Build Commands

### Development Build

```bash
# Clean build
cd ios
xcodebuild clean
cd ..

# Build and run on simulator
npm run ios

# Build and run on specific simulator
npm run ios -- --simulator="iPhone 14 Pro"

# Build and run on device
npm run ios -- --device

# Or use Xcode
# 1. Open YourApp.xcworkspace
# 2. Select device/simulator
# 3. Press Cmd + R
```

### Release Build

```bash
# Archive for App Store
cd ios
xcodebuild archive \
  -workspace YourApp.xcworkspace \
  -scheme YourApp \
  -archivePath ./build/YourApp.xcarchive

# Or use Xcode
# 1. Select "Any iOS Device" or your device
# 2. Product → Archive
# 3. Upload to App Store Connect
```

---

## Debugging

### Enable Console Logs

```bash
# View iOS simulator logs
xcrun simctl spawn booted log stream --predicate 'eventMessage contains "RN"'

# View device logs
idevicesyslog

# Or use Xcode
# Window → Devices and Simulators → Select device → View Device Logs
```

### Debug with Xcode

1. Open `ios/YourApp.xcworkspace` in Xcode
2. Set breakpoints in native code
3. Select device/simulator
4. Click **Run** (Cmd + R)
5. Debug panel shows native logs

### React Native Debugger

```bash
# Install React Native Debugger
brew install --cask react-native-debugger

# Run app with debugger
npm run ios

# Open debugger
open "rndebugger://set-debugger-loc?host=localhost&port=8081"
```

---

## Troubleshooting

### CocoaPods Issues

```bash
# Clear CocoaPods cache
cd ios
rm -rf Pods Podfile.lock
pod deintegrate
pod cache clean --all

# Reinstall
pod install

# If still fails, update CocoaPods
sudo gem install cocoapods
pod repo update
```

### Xcode Build Fails

```bash
# Clean build folder
cd ios
xcodebuild clean
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Rebuild
cd ..
npm run ios
```

### "No bundle URL present"

```bash
# Ensure Metro bundler is running
npm start

# Clear cache
npm start -- --reset-cache

# Or rebuild
cd ios
rm -rf build
cd ..
npm run ios
```

### Signing Issues

1. In Xcode, go to **Signing & Capabilities**
2. Select your team
3. If certificate issues, go to **Xcode → Preferences → Accounts**
4. Select your Apple ID
5. Click **Manage Certificates**
6. Click **+** to add iOS Development certificate

### BLE Not Working on Simulator

BLE doesn't work on iOS Simulator. Always test on physical device:

```bash
# Run on connected device
npm run ios -- --device

# Or select device in Xcode and press Cmd + R
```

---

## App Store Submission

### 1. Prepare Build

```bash
# Increment version
# Edit ios/YourApp/Info.plist
<key>CFBundleShortVersionString</key>
<string>1.0.0</string>
<key>CFBundleVersion</key>
<string>1</string>
```

### 2. Configure Release

```ruby
# ios/Podfile - Disable Flipper for release
use_flipper!({ 'Flipper' => '0.174.0' }) if ENV['CONFIGURATION'] == 'Debug'
```

### 3. Archive and Upload

1. In Xcode, select **Any iOS Device**
2. **Product → Scheme → Edit Scheme**
3. Set **Build Configuration** to **Release**
4. **Product → Archive**
5. In Organizer, click **Distribute App**
6. Follow prompts to upload to App Store Connect

### 4. App Store Description

Include Bluetooth usage in app description:

```
This app uses Bluetooth to connect to KGiTON scale devices for real-time weight measurements.

Features:
- Bluetooth Low Energy (BLE) connectivity
- Real-time weight data
- Device management
```

---

## Performance Optimization

### Enable Hermes

```ruby
# ios/Podfile
use_react_native!(
  :path => config[:reactNativePath],
  :hermes_enabled => true  # Enable Hermes
)
```

```bash
# Clean and reinstall
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

### Optimize Bundle Size

```javascript
// metro.config.js
module.exports = {
  transformer: {
    minifierConfig: {
      keep_classnames: true,
      keep_fnames: true,
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
  },
};
```

---

## Testing on Device

### Connect Device via USB

1. Connect iPhone/iPad via USB
2. Trust computer on device
3. In Xcode, select your device from device list
4. Press Cmd + R to build and run

### Wireless Debugging (Xcode 9+)

1. Connect device via USB
2. **Window → Devices and Simulators**
3. Select your device
4. Check **Connect via network**
5. Disconnect USB
6. Device shows with network icon
7. Can now build wirelessly

---

## Common Issues

### "Could not find iPhone X simulator"

```bash
# List available simulators
xcrun simctl list devices

# Run on specific simulator
npm run ios -- --simulator="iPhone 14 Pro"
```

### "library not found for -lDoubleConversion"

```bash
cd ios
pod deintegrate
pod install
cd ..
npm run ios
```

### "Module 'react-native-ble-plx' not found"

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
# Clean build in Xcode (Cmd + Shift + K)
npm run ios
```

### Bluetooth Permission Not Requested

Ensure `Info.plist` has both keys:
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`

Permission dialog appears automatically when first accessing Bluetooth.

---

## Device-Specific Considerations

### iPhone X and Later

Requires handling notch/safe areas:

```typescript
import { SafeAreaView } from 'react-native';

const App = () => (
  <SafeAreaView style={{ flex: 1 }}>
    <YourApp />
  </SafeAreaView>
);
```

### iPad Support

If supporting iPad, configure in Xcode:

1. Select target
2. **General → Deployment Info**
3. Check **iPad** under **Devices**
4. Configure orientation settings

---

## See Also

- [Installation Guide](./02-installation.md)
- [Troubleshooting](./19-troubleshooting.md)
- [Android Setup](./20-android-setup.md)
- [Testing Guide](./14-testing.md)
