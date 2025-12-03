# KGiTONScaleService API Reference

Complete API reference for the main `KGiTONScaleService` class.

## Class: KGiTONScaleService

The primary class for all BLE scale operations. Handles device scanning, connection management, authentication, and data streaming.

### Constructor

```typescript
constructor(enableLogging?: boolean)
```

Creates a new instance of the KGiTON Scale Service.

**Parameters:**
- `enableLogging` (optional): Enable console logging for debugging
  - Type: `boolean`
  - Default: `false`
  - Recommended: `true` for development, `false` for production

**Example:**
```typescript
// Development
const service = new KGiTONScaleService(true);

// Production
const service = new KGiTONScaleService(false);
// or
const service = new KGiTONScaleService();
```

**Returns:** `KGiTONScaleService` instance

---

## Device Scanning Methods

### scanForDevices()

```typescript
scanForDevices(timeoutMs?: number): Promise<void>
```

Starts scanning for nearby KGiTON scale devices.

**Parameters:**
- `timeoutMs` (optional): Scan timeout in milliseconds
  - Type: `number`
  - Default: `10000` (10 seconds)
  - Range: `1000` - `60000`

**Returns:** `Promise<void>`

**Throws:**
- `BLEConnectionException` if Bluetooth is disabled or unavailable

**Example:**
```typescript
// Default 10 second scan
await service.scanForDevices();

// Custom 15 second scan
await service.scanForDevices(15000);

// Receive found devices via event
service.setEventHandlers({
  onDevicesFound: (devices) => {
    console.log(`Found ${devices.length} devices`);
  }
});
```

**Notes:**
- Automatically stops after timeout
- Filters only KGiTON devices
- Removes duplicates
- Requires Bluetooth permissions
- Won't start if already scanning

---

### stopScan()

```typescript
stopScan(): void
```

Manually stops an active device scan.

**Parameters:** None

**Returns:** `void`

**Example:**
```typescript
// Start scanning
service.scanForDevices(30000);

// Stop early if needed
setTimeout(() => {
  service.stopScan();
}, 5000);
```

**Notes:**
- Safe to call even if not scanning
- Scan timeout automatically calls this
- Good practice to call when user navigates away

---

### getAvailableDevices()

```typescript
getAvailableDevices(): ScaleDevice[]
```

Gets the list of discovered devices from the last scan.

**Parameters:** None

**Returns:** `ScaleDevice[]` - Array of discovered devices

**Example:**
```typescript
await service.scanForDevices();

// After scan completes
const devices = service.getAvailableDevices();
devices.forEach(device => {
  console.log(`${device.name} - RSSI: ${device.rssi}`);
});
```

**Notes:**
- Returns empty array if no scan performed
- Devices sorted by signal strength (RSSI)
- Includes stored license keys if available

---

## Connection Methods

### connectWithLicenseKey()

```typescript
connectWithLicenseKey(
  deviceId: string,
  licenseKey: string
): Promise<ControlResponse>
```

Connects to a device and authenticates with a license key.

**Parameters:**
- `deviceId`: Unique device identifier
  - Type: `string`
  - From: `ScaleDevice.id`
- `licenseKey`: Valid license key
  - Type: `string`
  - Format: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

**Returns:** `Promise<ControlResponse>`

**Throws:**
- `LicenseKeyException` if license key format is invalid
- `BLEConnectionException` if connection fails
- `AuthenticationException` if authentication fails
- `DeviceNotFoundException` if device not found

**Example:**
```typescript
try {
  const response = await service.connectWithLicenseKey(
    'DEVICE_ID',
    'AB123-CD456-EF789-GH012-IJ345'
  );
  
  if (response.success) {
    console.log('Connected and authenticated!');
  }
} catch (error) {
  if (error instanceof LicenseKeyException) {
    console.error('Invalid license key');
  } else if (error instanceof AuthenticationException) {
    console.error('Authentication rejected');
  }
}
```

**Notes:**
- Automatically saves license key on success
- Subscribes to weight data notifications
- Changes state to `AUTHENTICATED` on success
- Full process takes 3-10 seconds typically

---

### disconnect()

```typescript
disconnect(): Promise<void>
```

Force disconnects from the current device without proper authentication.

**Parameters:** None

**Returns:** `Promise<void>`

**Example:**
```typescript
await service.disconnect();
console.log('Disconnected');
```

**Notes:**
- Use when license key not available
- Doesn't send disconnect command to device
- Changes state to `DISCONNECTED`
- Safe to call even if not connected

---

### disconnectWithLicenseKey()

```typescript
disconnectWithLicenseKey(licenseKey: string): Promise<ControlResponse>
```

Properly disconnects from device with authentication.

**Parameters:**
- `licenseKey`: The license key used for connection
  - Type: `string`
  - Format: `XXXXX-XXXXX-XXXXX-XXXXX-XXXXX`

**Returns:** `Promise<ControlResponse>`

**Example:**
```typescript
const response = await service.disconnectWithLicenseKey(
  'AB123-CD456-EF789-GH012-IJ345'
);

if (response.success) {
  console.log('Disconnected properly');
}
```

**Notes:**
- Preferred way to disconnect
- Sends proper disconnect command
- Device can log the disconnect
- Cleaner connection state

---

## Control Methods

### triggerBuzzer()

```typescript
triggerBuzzer(command: string): Promise<void>
```

Sends a buzzer control command to the device.

**Parameters:**
- `command`: Buzzer command
  - Type: `string`
  - Values: `'BEEP'`, `'BUZZ'`, `'LONG'`, `'OFF'`

**Returns:** `Promise<void>`

**Throws:**
- `AuthenticationException` if not authenticated
- `BLEConnectionException` if connection lost

**Example:**
```typescript
// Short beep
await service.triggerBuzzer('BEEP');

// Standard buzz
await service.triggerBuzzer('BUZZ');

// Long beep
await service.triggerBuzzer('LONG');

// Turn off
await service.triggerBuzzer('OFF');
```

**Buzzer Commands:**

| Command | Duration | Use Case |
|---------|----------|----------|
| `BEEP` | ~100ms | Quick feedback |
| `BUZZ` | ~300ms | Standard alert |
| `LONG` | ~1000ms | Important notification |
| `OFF` | - | Silence buzzer |

**Notes:**
- Requires authenticated connection
- Commands execute immediately
- No confirmation returned
- Device must support buzzer

---

## State Methods

### isBluetoothEnabled()

```typescript
isBluetoothEnabled(): Promise<boolean>
```

Checks if Bluetooth is enabled on the device.

**Parameters:** None

**Returns:** `Promise<boolean>`

**Example:**
```typescript
const enabled = await service.isBluetoothEnabled();
if (!enabled) {
  Alert.alert('Bluetooth', 'Please enable Bluetooth');
}
```

**Notes:**
- Always check before scanning
- Returns false if Bluetooth unavailable
- Platform-specific behavior

---

### enableBluetooth()

```typescript
enableBluetooth(): Promise<void>
```

Attempts to enable Bluetooth (Android only).

**Parameters:** None

**Returns:** `Promise<void>`

**Throws:**
- `BLEConnectionException` if cannot enable

**Example:**
```typescript
try {
  await service.enableBluetooth();
  console.log('Bluetooth enabled');
} catch (error) {
  console.log('User declined or iOS platform');
}
```

**Notes:**
- Android only - shows system dialog
- iOS: Must be enabled manually in Settings
- May be rejected by user

---

### getConnectionState()

```typescript
getConnectionState(): ScaleConnectionState
```

Gets the current connection state.

**Parameters:** None

**Returns:** `ScaleConnectionState` enum value

**Example:**
```typescript
const state = service.getConnectionState();

switch (state) {
  case ScaleConnectionState.DISCONNECTED:
    console.log('Not connected');
    break;
  case ScaleConnectionState.AUTHENTICATED:
    console.log('Ready to receive data');
    break;
}
```

**Possible States:**
- `DISCONNECTED`
- `SCANNING`
- `CONNECTING`
- `CONNECTED`
- `AUTHENTICATED`
- `ERROR`

---

### isConnected()

```typescript
isConnected(): boolean
```

Checks if device is connected (but may not be authenticated).

**Parameters:** None

**Returns:** `boolean`

**Example:**
```typescript
if (service.isConnected()) {
  console.log('Device connected');
} else {
  console.log('No device connected');
}
```

**Notes:**
- Returns `true` if `CONNECTED` or `AUTHENTICATED`
- Use `isAuthenticated()` to check if ready for data

---

### isAuthenticated()

```typescript
isAuthenticated(): boolean
```

Checks if device is fully authenticated and ready for data exchange.

**Parameters:** None

**Returns:** `boolean`

**Example:**
```typescript
if (service.isAuthenticated()) {
  // Can receive weight data and control buzzer
  await service.triggerBuzzer('BEEP');
}
```

**Notes:**
- Only `true` when fully authenticated
- Required for weight data and buzzer control
- Most reliable state check

---

### getConnectedDevice()

```typescript
getConnectedDevice(): ScaleDevice | null
```

Gets information about the currently connected device.

**Parameters:** None

**Returns:** `ScaleDevice | null`

**Example:**
```typescript
const device = service.getConnectedDevice();
if (device) {
  console.log(`Connected to: ${device.name}`);
  console.log(`Signal: ${device.rssi} dBm`);
  console.log(`ID: ${device.id}`);
}
```

**Notes:**
- Returns `null` if not connected
- Device info updated from connection
- RSSI may change during connection

---

## Event Handler Methods

### setEventHandlers()

```typescript
setEventHandlers(handlers: Partial<KGiTONEvents>): void
```

Registers event callbacks for SDK events.

**Parameters:**
- `handlers`: Object with event handler functions
  - Type: `Partial<KGiTONEvents>`

**Returns:** `void`

**Example:**
```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    console.log(`Weight: ${data.weight} kg`);
  },
  onConnectionStateChange: (state) => {
    console.log(`State: ${state}`);
  },
  onDevicesFound: (devices) => {
    console.log(`Found: ${devices.length} devices`);
  },
  onError: (error) => {
    console.error(`Error: ${error.message}`);
  }
});
```

**Event Types:**

```typescript
interface KGiTONEvents {
  onWeightData?: (data: WeightData) => void;
  onConnectionStateChange?: (state: ScaleConnectionState) => void;
  onDevicesFound?: (devices: ScaleDevice[]) => void;
  onError?: (error: Error) => void;
}
```

**Notes:**
- Can set individual or all handlers
- Handlers can be updated anytime
- Use `Partial<>` - all handlers optional
- Multiple calls merge handlers

---

### removeEventHandler()

```typescript
removeEventHandler(event: keyof KGiTONEvents): void
```

Removes a specific event handler.

**Parameters:**
- `event`: Event name to remove
  - Type: `keyof KGiTONEvents`
  - Values: `'onWeightData'`, `'onConnectionStateChange'`, `'onDevicesFound'`, `'onError'`

**Returns:** `void`

**Example:**
```typescript
// Remove weight data handler
service.removeEventHandler('onWeightData');

// Remove error handler
service.removeEventHandler('onError');
```

**Notes:**
- Safe to call even if handler not set
- Useful for cleanup or conditional handling
- Consider using `setEventHandlers` with `undefined` instead

---

## Lifecycle Methods

### dispose()

```typescript
dispose(): Promise<void>
```

Cleans up all resources and disconnects.

**Parameters:** None

**Returns:** `Promise<void>`

**Example:**
```typescript
// In React component
useEffect(() => {
  const service = new KGiTONScaleService();
  
  return () => {
    service.dispose();
  };
}, []);
```

**What it does:**
- Stops active scans
- Disconnects from device
- Clears event handlers
- Destroys BLE manager
- Releases memory

**Notes:**
- Always call when done with service
- Essential for React component cleanup
- Prevents memory leaks
- Safe to call multiple times

---

## Complete Usage Example

```typescript
import React, { useEffect, useState } from 'react';
import {
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState
} from '@kgiton/react-native-sdk';

const ScaleComponent = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [state, setState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );

  useEffect(() => {
    // Setup event handlers
    service.setEventHandlers({
      onWeightData: setWeight,
      onConnectionStateChange: setState,
      onDevicesFound: setDevices,
      onError: (error) => console.error(error)
    });

    // Cleanup
    return () => {
      service.dispose();
    };
  }, [service]);

  const handleScan = async () => {
    const isEnabled = await service.isBluetoothEnabled();
    if (!isEnabled) {
      console.log('Bluetooth not enabled');
      return;
    }
    
    await service.scanForDevices(15000);
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const response = await service.connectWithLicenseKey(
        deviceId,
        'YOUR-LICENSE-KEY'
      );
      console.log(response.message);
    } catch (error) {
      console.error(error);
    }
  };

  const handleBuzzer = async () => {
    if (service.isAuthenticated()) {
      await service.triggerBuzzer('BEEP');
    }
  };

  const handleDisconnect = async () => {
    await service.disconnect();
  };

  return (
    // Your UI here
    null
  );
};
```

---

## See Also

- [Models & Types](./08-api-models.md)
- [Error Handling](./11-error-handling.md)
- [Quick Start Guide](./02-quick-start.md)
