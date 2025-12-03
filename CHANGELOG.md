# Changelog

All notable changes to KGiTON React Native SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2025-12-03

### Added
- Initial release of KGiTON React Native SDK
- Core `KGiTONScaleService` class for BLE communication
- TypeScript support with full type definitions
- Device scanning with RSSI monitoring
- License-based authentication system
- Real-time weight data streaming (~10 Hz)
- Buzzer control (BEEP, BUZZ, LONG, OFF)
- Connection state management
- Event-based architecture for callbacks
- Automatic license key storage using AsyncStorage
- Connection stability monitoring
- Retry policy for BLE operations
- Data validation utilities
- Comprehensive error handling with custom exceptions:
  - `BLEConnectionException`
  - `DeviceNotFoundException`
  - `LicenseKeyException`
  - `AuthenticationException`
- Cross-platform support (iOS 10.0+ and Android 5.0+)
- Documentation:
  - README with quick start guide
  - AUTHORIZATION guide for licensing
  - SECURITY policy
  - LICENSE agreement
  - Complete API reference

### Features
- ✅ Auto-reconnection support
- ✅ Connection timeout handling
- ✅ Background mode support (iOS/Android)
- ✅ Multiple device support
- ✅ RSSI-based signal strength monitoring
- ✅ Automatic service and characteristic discovery
- ✅ Command response validation
- ✅ Bluetooth state monitoring

### Technical Details
- Built with TypeScript for type safety
- Uses `react-native-ble-plx` for BLE communication
- Uses `@react-native-async-storage/async-storage` for persistent storage
- Follows React Native best practices
- ESLint and Prettier configured
- Modular architecture for easy maintenance

### Supported BLE Characteristics
- TX Characteristic (UUID: `abcd1234-1234-1234-1234-123456789abc`) - Weight data
- Control Characteristic (UUID: `abcd0002-1234-1234-1234-123456789abc`) - Connection control
- Buzzer Characteristic (UUID: `abcd9999-1234-1234-1234-123456789abc`) - Buzzer control

### Known Limitations
- Requires explicit Bluetooth permissions on Android 12+
- Background scanning limited on iOS due to platform restrictions
- Single active connection at a time
- License key must match format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX

## [Unreleased]

### Planned Features
- [ ] Multiple simultaneous device connections
- [ ] Offline mode with data caching
- [ ] Advanced filtering options for device scanning
- [ ] Automatic firmware update detection
- [ ] Data export functionality
- [ ] React hooks for easier integration
- [ ] Context provider for global SDK state
- [ ] Example app with complete UI
- [ ] Unit tests and integration tests
- [ ] Performance monitoring
- [ ] Analytics integration

---

For more information, visit: https://github.com/kuldii/react-native-kgiton-sdk

© 2025 PT KGiTON. All rights reserved.
