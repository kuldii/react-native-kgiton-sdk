# Models & Types API Reference

Complete reference for all data models and TypeScript types in the KGiTON SDK.

## Overview

The SDK provides strongly-typed models for all data structures. This ensures type safety and enables better IDE support with IntelliSense/autocomplete.

## Core Models

### ScaleDevice

Represents a discovered or connected BLE scale device.

```typescript
interface ScaleDevice {
  id: string;
  name: string;
  rssi: number;
  licenseKey?: string;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Unique device identifier (MAC address on Android, UUID on iOS) |
| `name` | `string` | Human-readable device name (e.g., "KGiTON-001") |
| `rssi` | `number` | Signal strength in dBm (-100 to 0, higher is better) |
| `licenseKey` | `string?` | Stored license key if previously authenticated |

#### Example

```typescript
const device: ScaleDevice = {
  id: '00:11:22:33:44:55',
  name: 'KGiTON-001',
  rssi: -65,
  licenseKey: 'AB123-CD456-EF789-GH012-IJ345'
};

// Check signal quality
if (device.rssi > -70) {
  console.log('Good signal');
} else if (device.rssi > -85) {
  console.log('Fair signal');
} else {
  console.log('Weak signal');
}
```

#### Factory

```typescript
class ScaleDeviceFactory {
  static create(
    id: string,
    name: string,
    rssi: number,
    licenseKey?: string
  ): ScaleDevice;
  
  static fromBLEDevice(device: Device): ScaleDevice;
}
```

**Usage:**
```typescript
import { ScaleDeviceFactory } from '@kgiton/react-native-sdk';

const device = ScaleDeviceFactory.create(
  'DEVICE_ID',
  'KGiTON-001',
  -65,
  'LICENSE_KEY'
);
```

---

### WeightData

Represents a weight measurement from the scale.

```typescript
interface WeightData {
  weight: number;
  timestamp: number;
  deviceId: string;
  unit?: string;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `weight` | `number` | Weight value (precision: 3 decimal places) |
| `timestamp` | `number` | Unix timestamp in milliseconds when measurement taken |
| `deviceId` | `string` | ID of the device that sent this measurement |
| `unit` | `string?` | Measurement unit (default: 'kg') |

#### Example

```typescript
const weightData: WeightData = {
  weight: 12.345,
  timestamp: 1701619200000,
  deviceId: '00:11:22:33:44:55',
  unit: 'kg'
};

// Format for display
const displayWeight = `${weightData.weight.toFixed(3)} ${weightData.unit}`;
console.log(displayWeight); // "12.345 kg"

// Convert timestamp to date
const measurementTime = new Date(weightData.timestamp);
console.log(measurementTime.toLocaleString());
```

#### Factory

```typescript
class WeightDataFactory {
  static create(
    weight: number,
    deviceId: string,
    unit?: string
  ): WeightData;
  
  static fromJSON(json: string, deviceId: string): WeightData;
}
```

**Usage:**
```typescript
import { WeightDataFactory } from '@kgiton/react-native-sdk';

// Manual creation
const data = WeightDataFactory.create(12.345, 'DEVICE_ID', 'kg');

// From JSON (internal use)
const data = WeightDataFactory.fromJSON(
  '{"w": 12.345, "u": "kg"}',
  'DEVICE_ID'
);
```

---

### ControlResponse

Represents a response from control commands (connection, disconnection, etc.).

```typescript
interface ControlResponse {
  success: boolean;
  message: string;
  data?: any;
}
```

#### Properties

| Property | Type | Description |
|----------|------|-------------|
| `success` | `boolean` | Whether the operation succeeded |
| `message` | `string` | Human-readable message describing the result |
| `data` | `any?` | Optional additional data from the operation |

#### Example

```typescript
const response: ControlResponse = {
  success: true,
  message: 'Connected and authenticated successfully',
  data: {
    deviceId: '00:11:22:33:44:55',
    firmwareVersion: '1.0.0'
  }
};

if (response.success) {
  Alert.alert('Success', response.message);
} else {
  Alert.alert('Error', response.message);
}
```

#### Common Messages

**Success Messages:**
- `"Connected and authenticated successfully"`
- `"Disconnected successfully"`
- `"Authentication successful"`

**Error Messages:**
- `"Authentication failed: Invalid license key"`
- `"Connection timeout"`
- `"Device not found"`
- `"License key expired"`

#### Factory

```typescript
class ControlResponseFactory {
  static success(message: string, data?: any): ControlResponse;
  static failure(message: string, data?: any): ControlResponse;
  static fromJSON(json: string): ControlResponse;
}
```

**Usage:**
```typescript
import { ControlResponseFactory } from '@kgiton/react-native-sdk';

// Create success response
const success = ControlResponseFactory.success(
  'Operation completed',
  { timestamp: Date.now() }
);

// Create failure response
const failure = ControlResponseFactory.failure(
  'Operation failed',
  { errorCode: 'AUTH_001' }
);
```

---

### ScaleConnectionState

Enum representing the connection state of the scale.

```typescript
enum ScaleConnectionState {
  DISCONNECTED = 'DISCONNECTED',
  SCANNING = 'SCANNING',
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  AUTHENTICATED = 'AUTHENTICATED',
  ERROR = 'ERROR'
}
```

#### States

| State | Description | Can Scan? | Can Connect? | Can Receive Data? |
|-------|-------------|-----------|--------------|-------------------|
| `DISCONNECTED` | No active connection | ✅ | ✅ | ❌ |
| `SCANNING` | Actively scanning for devices | ❌ | ❌ | ❌ |
| `CONNECTING` | Establishing connection | ❌ | ❌ | ❌ |
| `CONNECTED` | Connected but not authenticated | ❌ | ❌ | ❌ |
| `AUTHENTICATED` | Fully authenticated and ready | ❌ | ❌ | ✅ |
| `ERROR` | Error occurred | ✅ | ✅ | ❌ |

#### Example

```typescript
import { ScaleConnectionState } from '@kgiton/react-native-sdk';

const state = service.getConnectionState();

switch (state) {
  case ScaleConnectionState.DISCONNECTED:
    console.log('Ready to scan or connect');
    break;
    
  case ScaleConnectionState.SCANNING:
    console.log('Scanning for devices...');
    break;
    
  case ScaleConnectionState.CONNECTING:
    console.log('Connecting to device...');
    break;
    
  case ScaleConnectionState.CONNECTED:
    console.log('Connected, authenticating...');
    break;
    
  case ScaleConnectionState.AUTHENTICATED:
    console.log('Ready to receive weight data');
    break;
    
  case ScaleConnectionState.ERROR:
    console.log('Error occurred, will disconnect');
    break;
}
```

#### Helper Functions

```typescript
class ConnectionStateHelpers {
  static canScan(state: ScaleConnectionState): boolean;
  static canConnect(state: ScaleConnectionState): boolean;
  static canReceiveData(state: ScaleConnectionState): boolean;
  static isTerminalState(state: ScaleConnectionState): boolean;
  static getStateColor(state: ScaleConnectionState): string;
  static getStateIcon(state: ScaleConnectionState): string;
}
```

**Usage:**
```typescript
import { ConnectionStateHelpers } from '@kgiton/react-native-sdk';

const state = service.getConnectionState();

// Check capabilities
if (ConnectionStateHelpers.canScan(state)) {
  await service.scanForDevices();
}

if (ConnectionStateHelpers.canReceiveData(state)) {
  // Can receive weight data
}

// UI helpers
const color = ConnectionStateHelpers.getStateColor(state);
const icon = ConnectionStateHelpers.getStateIcon(state);
```

---

## Event Types

### KGiTONEvents

Interface for event handler callbacks.

```typescript
interface KGiTONEvents {
  onWeightData?: (data: WeightData) => void;
  onConnectionStateChange?: (state: ScaleConnectionState) => void;
  onDevicesFound?: (devices: ScaleDevice[]) => void;
  onError?: (error: Error) => void;
}
```

#### Event Handlers

##### onWeightData

Called when new weight measurement is received (authenticated state only).

```typescript
onWeightData?: (data: WeightData) => void
```

**Frequency:** ~10 Hz (10 times per second)

**Example:**
```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    console.log(`Weight: ${data.weight} kg`);
    console.log(`Device: ${data.deviceId}`);
    console.log(`Time: ${new Date(data.timestamp).toLocaleString()}`);
  }
});
```

##### onConnectionStateChange

Called when connection state changes.

```typescript
onConnectionStateChange?: (state: ScaleConnectionState) => void
```

**Example:**
```typescript
service.setEventHandlers({
  onConnectionStateChange: (state) => {
    console.log(`State changed to: ${state}`);
    
    if (state === ScaleConnectionState.AUTHENTICATED) {
      console.log('Ready to receive data');
    } else if (state === ScaleConnectionState.ERROR) {
      console.log('Error occurred');
    }
  }
});
```

##### onDevicesFound

Called when devices are discovered during scanning.

```typescript
onDevicesFound?: (devices: ScaleDevice[]) => void
```

**Example:**
```typescript
service.setEventHandlers({
  onDevicesFound: (devices) => {
    console.log(`Found ${devices.length} device(s)`);
    
    devices.forEach(device => {
      console.log(`- ${device.name} (${device.rssi} dBm)`);
    });
  }
});
```

##### onError

Called when an error occurs.

```typescript
onError?: (error: Error) => void
```

**Example:**
```typescript
service.setEventHandlers({
  onError: (error) => {
    console.error('SDK Error:', error.message);
    
    if (error instanceof BLEConnectionException) {
      Alert.alert('Connection Error', error.message);
    } else if (error instanceof AuthenticationException) {
      Alert.alert('Authentication Failed', error.message);
    }
  }
});
```

---

## Exception Types

### KGiTONException

Base exception class for all SDK errors.

```typescript
class KGiTONException extends Error {
  constructor(message: string);
}
```

**Example:**
```typescript
import { KGiTONException } from '@kgiton/react-native-sdk';

try {
  // SDK operation
} catch (error) {
  if (error instanceof KGiTONException) {
    console.error('SDK Error:', error.message);
  }
}
```

---

### BLEConnectionException

Thrown when BLE connection fails.

```typescript
class BLEConnectionException extends KGiTONException {
  constructor(message: string);
}
```

**Common Messages:**
- `"Bluetooth is not enabled"`
- `"Connection timeout"`
- `"Device disconnected unexpectedly"`
- `"Failed to discover services"`

**Example:**
```typescript
import { BLEConnectionException } from '@kgiton/react-native-sdk';

try {
  await service.connectWithLicenseKey(deviceId, key);
} catch (error) {
  if (error instanceof BLEConnectionException) {
    if (error.message.includes('timeout')) {
      // Handle timeout
    } else if (error.message.includes('not enabled')) {
      // Prompt user to enable Bluetooth
    }
  }
}
```

---

### DeviceNotFoundException

Thrown when specified device cannot be found.

```typescript
class DeviceNotFoundException extends KGiTONException {
  constructor(deviceId: string);
}
```

**Example:**
```typescript
import { DeviceNotFoundException } from '@kgiton/react-native-sdk';

try {
  await service.connectWithLicenseKey('INVALID_ID', key);
} catch (error) {
  if (error instanceof DeviceNotFoundException) {
    Alert.alert('Device Not Found', 'Please scan again');
  }
}
```

---

### LicenseKeyException

Thrown when license key is invalid or malformed.

```typescript
class LicenseKeyException extends KGiTONException {
  constructor(message: string);
}
```

**Common Messages:**
- `"Invalid license key format"`
- `"License key is required"`
- `"License key must be 29 characters"`

**Example:**
```typescript
import { LicenseKeyException } from '@kgiton/react-native-sdk';

try {
  await service.connectWithLicenseKey(deviceId, 'invalid');
} catch (error) {
  if (error instanceof LicenseKeyException) {
    Alert.alert('Invalid License', 'Please check your license key');
  }
}
```

---

### AuthenticationException

Thrown when authentication fails.

```typescript
class AuthenticationException extends KGiTONException {
  constructor(message: string);
}
```

**Common Messages:**
- `"Authentication failed: Invalid license key"`
- `"License key expired"`
- `"Device not authorized for this license"`
- `"Authentication timeout"`

**Example:**
```typescript
import { AuthenticationException } from '@kgiton/react-native-sdk';

try {
  await service.connectWithLicenseKey(deviceId, key);
} catch (error) {
  if (error instanceof AuthenticationException) {
    if (error.message.includes('expired')) {
      Alert.alert('License Expired', 'Please renew your license');
    } else {
      Alert.alert('Authentication Failed', error.message);
    }
  }
}
```

---

## Type Guards

### Checking Types at Runtime

```typescript
// Check if error is SDK error
function isKGiTONError(error: any): error is KGiTONException {
  return error instanceof KGiTONException;
}

// Check if device has license
function hasStoredLicense(device: ScaleDevice): boolean {
  return device.licenseKey !== undefined && device.licenseKey.length > 0;
}

// Check if weight data is valid
function isValidWeightData(data: WeightData): boolean {
  return (
    typeof data.weight === 'number' &&
    data.weight >= 0 &&
    typeof data.timestamp === 'number' &&
    typeof data.deviceId === 'string'
  );
}
```

---

## Utility Types

### Partial Event Handlers

```typescript
type PartialEventHandlers = Partial<KGiTONEvents>;

// Usage
const handlers: PartialEventHandlers = {
  onWeightData: (data) => console.log(data),
  // Other handlers are optional
};
```

### Device Predicate

```typescript
type DevicePredicate = (device: ScaleDevice) => boolean;

// Usage
const hasGoodSignal: DevicePredicate = (device) => device.rssi > -70;
const hasLicense: DevicePredicate = (device) => !!device.licenseKey;

const goodDevices = devices.filter(hasGoodSignal);
```

---

## Complete TypeScript Example

```typescript
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ControlResponse,
  ScaleConnectionState,
  KGiTONEvents,
  BLEConnectionException,
  AuthenticationException,
  LicenseKeyException,
  DeviceNotFoundException
} from '@kgiton/react-native-sdk';

class ScaleManager {
  private service: KGiTONScaleService;
  private currentDevice: ScaleDevice | null = null;
  private latestWeight: WeightData | null = null;

  constructor() {
    this.service = new KGiTONScaleService(true);
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    const handlers: KGiTONEvents = {
      onWeightData: this.handleWeightData.bind(this),
      onConnectionStateChange: this.handleStateChange.bind(this),
      onDevicesFound: this.handleDevicesFound.bind(this),
      onError: this.handleError.bind(this)
    };

    this.service.setEventHandlers(handlers);
  }

  private handleWeightData(data: WeightData): void {
    this.latestWeight = data;
    console.log(`Weight: ${data.weight.toFixed(3)} ${data.unit}`);
  }

  private handleStateChange(state: ScaleConnectionState): void {
    console.log(`Connection state: ${state}`);
    
    if (state === ScaleConnectionState.AUTHENTICATED) {
      console.log('Ready for data');
    }
  }

  private handleDevicesFound(devices: ScaleDevice[]): void {
    console.log(`Found ${devices.length} device(s)`);
    
    // Filter devices with good signal
    const goodSignal = devices.filter(d => d.rssi > -70);
    console.log(`${goodSignal.length} with good signal`);
  }

  private handleError(error: Error): void {
    if (error instanceof BLEConnectionException) {
      console.error('BLE Connection Error:', error.message);
    } else if (error instanceof AuthenticationException) {
      console.error('Authentication Error:', error.message);
    } else if (error instanceof LicenseKeyException) {
      console.error('License Key Error:', error.message);
    } else if (error instanceof DeviceNotFoundException) {
      console.error('Device Not Found:', error.message);
    } else {
      console.error('Unknown Error:', error.message);
    }
  }

  async scan(): Promise<ScaleDevice[]> {
    await this.service.scanForDevices(15000);
    return this.service.getAvailableDevices();
  }

  async connect(device: ScaleDevice, key: string): Promise<ControlResponse> {
    this.currentDevice = device;
    return await this.service.connectWithLicenseKey(device.id, key);
  }

  async disconnect(): Promise<void> {
    await this.service.disconnect();
    this.currentDevice = null;
  }

  getLatestWeight(): WeightData | null {
    return this.latestWeight;
  }

  getCurrentDevice(): ScaleDevice | null {
    return this.currentDevice;
  }

  dispose(): void {
    this.service.dispose();
  }
}

export default ScaleManager;
```

---

## See Also

- [Service API Reference](./07-api-service.md)
- [Error Handling Guide](./11-error-handling.md)
- [TypeScript Support](./02-quick-start.md)
