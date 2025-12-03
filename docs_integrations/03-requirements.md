# Requirements

## System Requirements

### Development Environment

- **Node.js**: 14.0 or higher (16+ recommended)
- **npm**: 6.0 or higher (or yarn 1.22+)
- **React Native**: 0.70.0 or higher
- **TypeScript**: 4.0+ (optional but recommended)

### Android Development

- **Android Studio**: Arctic Fox (2020.3.1) or higher
- **Android SDK**: API Level 21 (Android 5.0) or higher
- **Gradle**: 7.0 or higher
- **Java**: JDK 11 or higher

#### Minimum Android Requirements

- **minSdkVersion**: 21 (Android 5.0 Lollipop)
- **targetSdkVersion**: 33+ (Android 13+)
- **compileSdkVersion**: 33+

#### Required Android Permissions

```xml
<!-- Basic Bluetooth -->
<uses-permission android:name="android.permission.BLUETOOTH"/>
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN"/>

<!-- Android 12+ (API 31+) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN"/>
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT"/>

<!-- Location for BLE -->
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"/>
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"/>
```

### iOS Development

- **macOS**: 11.0 (Big Sur) or higher
- **Xcode**: 13.0 or higher
- **CocoaPods**: 1.11.0 or higher
- **iOS Deployment Target**: 13.0 or higher

#### Minimum iOS Requirements

- **Minimum iOS Version**: 13.0
- **Recommended iOS Version**: 15.0+

#### Required iOS Capabilities

- Background Modes: Bluetooth LE accessories (optional)

#### Required iOS Privacy Descriptions

```xml
<key>NSBluetoothAlwaysUsageDescription</key>
<string>Required for connecting to KGiTON scale devices</string>

<key>NSBluetoothPeripheralUsageDescription</key>
<string>Required for communicating with KGiTON scale devices</string>

<key>NSLocationWhenInUseUsageDescription</key>
<string>Required for scanning Bluetooth devices</string>
```

## Hardware Requirements

### Development Device/Emulator

#### Android
- Physical device with Bluetooth 4.0+ (BLE) support (recommended)
- Android Emulator does not support Bluetooth hardware
- USB debugging enabled

#### iOS
- Physical device with Bluetooth 4.0+ (BLE) support (required)
- iOS Simulator does not support Bluetooth hardware
- Development provisioning profile

### Target Scale Device

- **ESP32-based** KGiTON scale device
- **Bluetooth**: BLE 4.0 or higher
- **Firmware**: Compatible with SDK protocol version
- **Power**: Adequate battery level for stable connection
- **Valid License Key**: Required for authentication

## Dependencies

### Required Peer Dependencies

```json
{
  "react": ">=17.0.0",
  "react-native": ">=0.70.0",
  "react-native-ble-plx": "^3.0.0",
  "@react-native-async-storage/async-storage": "^1.17.0"
}
```

### Optional Dependencies

```json
{
  "@types/react": "^18.0.0",
  "@types/react-native": "^0.70.0"
}
```

## Knowledge Prerequisites

### Required Knowledge

- **JavaScript/TypeScript**: Basic to intermediate
- **React Native**: Familiarity with components, hooks, and lifecycle
- **Promises/Async-Await**: Understanding asynchronous operations
- **Mobile App Development**: Basic understanding of mobile platforms

### Recommended Knowledge

- **Bluetooth Low Energy (BLE)**: Basic concepts
- **Event-Driven Programming**: Understanding callbacks and event handlers
- **Error Handling**: Try-catch blocks and error management
- **React Hooks**: useState, useEffect, custom hooks
- **Mobile Permissions**: Runtime permission handling

## Feature Requirements by Platform

### Android

| Feature | Minimum API | Notes |
|---------|------------|-------|
| BLE Scanning | 21 | Core functionality |
| BLE Connection | 21 | Core functionality |
| Runtime Permissions | 23 | Automatic on API 21-22 |
| Background BLE | 21 | Requires foreground service on 26+ |
| BLE Scan Filtering | 21 | Improves performance |

### iOS

| Feature | Minimum Version | Notes |
|---------|----------------|-------|
| BLE Scanning | 13.0 | Core functionality |
| BLE Connection | 13.0 | Core functionality |
| Background BLE | 13.0 | Requires capability enabled |
| CoreBluetooth | 13.0 | Framework used |

## Network & Connectivity

- **Internet**: Not required for BLE communication
- **Bluetooth**: Must be enabled and functional
- **Location Services**: Required on Android for BLE scanning
- **WiFi**: Not required

## Storage Requirements

- **App Size**: ~2-5 MB (SDK only)
- **Runtime Memory**: ~10-20 MB (depending on usage)
- **Persistent Storage**: <1 MB (for license key storage)

## Performance Requirements

### Minimum Device Specifications

#### Android
- **RAM**: 2 GB minimum, 4 GB+ recommended
- **CPU**: Quad-core 1.4 GHz minimum
- **Bluetooth**: 4.0 (BLE) or higher

#### iOS
- **Device**: iPhone 6s or newer
- **RAM**: 2 GB minimum
- **Bluetooth**: 4.0 (BLE) or higher

### Recommended Specifications

- **RAM**: 4 GB or more
- **CPU**: Octa-core 1.8 GHz or better
- **Bluetooth**: 5.0 or higher
- **OS**: Android 10+ or iOS 15+

## Security Requirements

- **Secure Storage**: For license keys (provided by AsyncStorage)
- **Bluetooth Pairing**: Not required (uses BLE GATT)
- **SSL/TLS**: Not applicable (local BLE communication)
- **Permissions**: Properly requested and handled

## Testing Requirements

### Development Testing
- Physical device with BLE support (required)
- Valid KGiTON scale device for integration testing
- Test license keys

### Production Testing
- Multiple physical devices (various OS versions)
- Different scale device firmware versions
- Various environment conditions (distance, interference)

## Compliance & Regulations

### Android
- Google Play Store policies compliance
- Bluetooth permission usage explanation
- Location permission usage explanation (for BLE scanning)

### iOS
- App Store Review Guidelines compliance
- Privacy policy for Bluetooth usage
- Purpose strings for all capabilities

## Browser/WebView Support

This SDK is designed for **React Native mobile applications only**. It does **not support**:

- React Native Web
- Expo (unless using bare workflow)
- WebView-based applications
- Progressive Web Apps (PWA)

## Limitations

### Platform Limitations

**Android:**
- Emulator does not support Bluetooth hardware
- Some devices have unreliable BLE implementation
- Background scanning restricted on Android 8.0+
- Location permission required for BLE scanning

**iOS:**
- Simulator does not support Bluetooth hardware
- Background BLE requires capability setup
- Strict privacy requirements for Bluetooth usage
- Limited to central role only

### SDK Limitations

- **Maximum Concurrent Connections**: 1 device at a time
- **Scan Range**: ~10 meters (varies by device and environment)
- **Data Rate**: Limited by BLE bandwidth (~1 KB/s typical)
- **Reconnection**: Manual reconnection required after disconnect

## Version Compatibility

### React Native Versions

| SDK Version | React Native Version | Status |
|-------------|---------------------|--------|
| 1.0.0 | 0.70.x - 0.74.x | ✅ Supported |
| 1.0.0 | 0.60.x - 0.69.x | ⚠️ May work, not tested |
| 1.0.0 | < 0.60 | ❌ Not supported |

### Node.js Versions

| Node.js | Status |
|---------|--------|
| 18.x | ✅ Recommended |
| 16.x | ✅ Supported |
| 14.x | ✅ Minimum |
| 12.x | ❌ Not supported |

## Verification Checklist

Before starting development, verify:

- [ ] Development environment meets minimum requirements
- [ ] Physical device available for testing (emulator won't work)
- [ ] Bluetooth is functional on test device
- [ ] Required permissions added to project
- [ ] Dependencies installed correctly
- [ ] KGiTON scale device available
- [ ] Valid license key obtained
- [ ] Platform-specific setup completed

## Next Steps

Once requirements are verified:

1. Proceed to [Installation Guide](./01-installation.md)
2. Review [Architecture Overview](./04-architecture.md)
3. Start with [Quick Start Guide](./02-quick-start.md)
