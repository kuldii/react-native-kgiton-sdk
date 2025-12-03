# KGiTON React Native SDK Documentation

Complete documentation for integrating KGiTON ESP32-based scale devices with React Native applications via Bluetooth Low Energy (BLE).

## Documentation Index

### Getting Started
- [Installation Guide](./01-installation.md) - Setup and installation instructions
- [Quick Start](./02-quick-start.md) - Get up and running in 5 minutes
- [Requirements](./03-requirements.md) - System requirements and prerequisites

### Core Concepts
- [Architecture Overview](./04-architecture.md) - Understanding the SDK architecture
- [BLE Communication](./05-ble-communication.md) - How BLE communication works
- [Authentication & Licensing](./06-authentication.md) - Device authentication and license management

### API Reference
- [KGiTONScaleService API](./07-api-service.md) - Main service class reference
- [Models & Types](./08-api-models.md) - Data models and TypeScript types
- [Hooks API](./09-api-hooks.md) - React Hooks for easy integration
- [Context API](./10-api-context.md) - React Context for state management

### Advanced Topics
- [Error Handling](./11-error-handling.md) - Exception handling and error recovery
- [Connection Stability](./12-connection-stability.md) - Managing stable BLE connections
- [Performance Optimization](./13-performance.md) - Tips for optimal performance
- [Testing](./14-testing.md) - Testing your integration

### Guides & Examples
- [Basic Integration](./15-basic-integration.md) - Step-by-step integration guide
- [Using Hooks](./16-hooks-integration.md) - Integration with React Hooks
- [Using Context](./17-context-integration.md) - Integration with React Context
- [Permissions Setup](./18-permissions.md) - Android & iOS permissions configuration
- [Troubleshooting](./19-troubleshooting.md) - Common issues and solutions

### Platform Specific
- [Android Setup](./20-android-setup.md) - Android-specific configuration
- [iOS Setup](./21-ios-setup.md) - iOS-specific configuration

### Additional Resources
- [Changelog](../CHANGELOG.md) - Version history and updates
- [License](../LICENSE) - License information
- [Security](../SECURITY.md) - Security best practices

## Quick Links

### Need Help?
- 📖 [Full Documentation](./01-installation.md)
- 💡 [Examples](../example/)
- 🐛 [Issue Tracker](https://github.com/kuldii/react-native-kgiton-sdk/issues)

### Version Information
- Current Version: 1.0.0
- Minimum React Native: 0.70.0
- Minimum Android API: 21 (Android 5.0)
- Minimum iOS: 13.0

## Getting Started

The fastest way to get started:

1. Install the SDK:
   ```bash
   npm install @kgiton/react-native-sdk
   ```

2. Configure permissions (see [Permissions Setup](./18-permissions.md))

3. Start using:
   ```typescript
   import { KGiTONScaleService } from '@kgiton/react-native-sdk';
   
   const service = new KGiTONScaleService();
   await service.scanForDevices();
   ```

For detailed instructions, continue to [Installation Guide](./01-installation.md).
