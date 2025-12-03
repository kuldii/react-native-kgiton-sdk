# Architecture Overview

Understanding the architecture of the KGiTON React Native SDK will help you integrate it effectively into your application.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     React Native App                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Hooks     │  │   Context    │  │  Components  │       │
│  │  (Optional) │  │  (Optional)  │  │              │       │
│  └──────┬──────┘  └──────┬───────┘  └──────┬───────┘       │
│         │                 │                  │               │
│         └────────────┬────┴──────────────────┘               │
│                      │                                       │
│         ┌────────────▼────────────────┐                     │
│         │  KGiTONScaleService         │                     │
│         │  (Main SDK Class)           │                     │
│         └────────────┬────────────────┘                     │
│                      │                                       │
│    ┌─────────────────┼─────────────────┐                   │
│    │                 │                 │                   │
│    ▼                 ▼                 ▼                   │
│ ┌────────┐      ┌────────┐      ┌─────────┐              │
│ │ Models │      │ Utils  │      │Exceptions│              │
│ └────────┘      └────────┘      └─────────┘              │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│            react-native-ble-plx (BLE Manager)               │
├─────────────────────────────────────────────────────────────┤
│                   Native BLE Layer                          │
│         (Android BluetoothLE / iOS CoreBluetooth)           │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│              ESP32 KGiTON Scale Device (BLE)                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. KGiTONScaleService

The main service class that handles all BLE operations and state management.

**Responsibilities:**
- Device scanning and discovery
- Connection management
- Authentication with license keys
- Data streaming (weight data)
- Buzzer control
- Event emission
- Error handling

**Key Features:**
- Singleton-like behavior per instance
- Event-driven architecture
- Automatic reconnection handling
- License key persistence

### 2. Models

Data structures representing various entities:

#### ScaleDevice
```typescript
interface ScaleDevice {
  id: string;           // Unique device identifier
  name: string;         // Device name
  rssi: number;         // Signal strength
  licenseKey?: string;  // Stored license key
}
```

#### WeightData
```typescript
interface WeightData {
  weight: number;       // Weight in kg
  timestamp: number;    // Unix timestamp
  deviceId: string;     // Source device ID
  unit?: string;        // Unit (default: 'kg')
}
```

#### ControlResponse
```typescript
interface ControlResponse {
  success: boolean;     // Operation success status
  message: string;      // Response message
  data?: any;          // Optional additional data
}
```

#### ScaleConnectionState
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

### 3. Utilities

Helper classes for common operations:

#### DataValidation
- Validates weight data format
- Validates license key format
- Sanitizes device names
- Checks data integrity

#### ConnectionStability
- Monitors connection quality
- Tracks RSSI changes
- Detects unstable connections
- Provides stability metrics

#### RetryPolicy
- Configurable retry logic
- Exponential backoff
- Maximum retry limits
- Failure callbacks

#### Base64Utils
- Encode/decode Base64 strings
- Used for license key transmission

### 4. Exceptions

Custom error classes for better error handling:

- `KGiTONException` - Base exception class
- `BLEConnectionException` - BLE connection errors
- `DeviceNotFoundException` - Device not found
- `LicenseKeyException` - Invalid license key
- `AuthenticationException` - Authentication failures

### 5. Constants

Centralized configuration values:

```typescript
class BLEConstants {
  // BLE Service UUIDs
  static readonly SERVICE_UUID = 'YOUR-SERVICE-UUID';
  
  // Characteristic UUIDs
  static readonly WEIGHT_CHARACTERISTIC_UUID = 'WEIGHT-UUID';
  static readonly CONTROL_CHARACTERISTIC_UUID = 'CONTROL-UUID';
  static readonly BUZZER_CHARACTERISTIC_UUID = 'BUZZER-UUID';
  
  // Timeouts
  static readonly DEFAULT_SCAN_TIMEOUT = 10000;
  static readonly CONNECTION_TIMEOUT = 15000;
  
  // Retry configuration
  static readonly MAX_RETRIES = 3;
  static readonly RETRY_DELAY = 1000;
}
```

## Data Flow

### 1. Device Discovery Flow

```
User → scanForDevices()
  ↓
Check Bluetooth Enabled
  ↓
Start BLE Scan
  ↓
Filter KGiTON Devices
  ↓
Emit onDevicesFound Event
  ↓
User receives device list
```

### 2. Connection Flow

```
User → connectWithLicenseKey(deviceId, licenseKey)
  ↓
Validate License Key Format
  ↓
Connect to Device (BLE)
  ↓
Discover Services & Characteristics
  ↓
Setup Control Listener
  ↓
Send License Key (Authentication)
  ↓
Receive Authentication Response
  ↓
Setup Weight Data Listener
  ↓
Save License Key (if successful)
  ↓
Emit onConnectionStateChange(AUTHENTICATED)
  ↓
User receives confirmation
```

### 3. Weight Data Flow

```
Scale Device → Sends Weight (BLE Notification)
  ↓
BLE Manager receives data
  ↓
KGiTONScaleService processes data
  ↓
Validate data format
  ↓
Create WeightData object
  ↓
Emit onWeightData Event
  ↓
User receives weight data
```

### 4. Buzzer Control Flow

```
User → triggerBuzzer(command)
  ↓
Check Authentication
  ↓
Validate Command
  ↓
Write to Buzzer Characteristic
  ↓
Device triggers buzzer
  ↓
Confirmation (if needed)
```

## Event System

The SDK uses an event-driven architecture for reactive updates:

### Event Types

```typescript
interface KGiTONEvents {
  onWeightData: (data: WeightData) => void;
  onConnectionStateChange: (state: ScaleConnectionState) => void;
  onDevicesFound: (devices: ScaleDevice[]) => void;
  onError: (error: Error) => void;
}
```

### Event Flow

```
SDK Internal Event → Event Handler Check → Emit to Registered Handler → User Callback
```

### Event Registration

```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    // Handle weight data
  },
  onConnectionStateChange: (state) => {
    // Handle state changes
  },
  onDevicesFound: (devices) => {
    // Handle found devices
  },
  onError: (error) => {
    // Handle errors
  }
});
```

## State Management

### Connection States

```
DISCONNECTED → SCANNING → DISCONNECTED
DISCONNECTED → CONNECTING → CONNECTED → AUTHENTICATED
AUTHENTICATED → DISCONNECTED
Any State → ERROR → DISCONNECTED
```

### State Transitions

1. **DISCONNECTED**: Initial state, no active connection
2. **SCANNING**: Actively scanning for devices
3. **CONNECTING**: Attempting to connect to a device
4. **CONNECTED**: BLE connection established, awaiting authentication
5. **AUTHENTICATED**: Fully authenticated and ready for data exchange
6. **ERROR**: Error occurred, will transition to DISCONNECTED

## Storage Architecture

### License Key Persistence

```
User → Authenticate with License Key
  ↓
Authentication Successful
  ↓
Store in AsyncStorage
  ↓
Map: { deviceId: licenseKey }
  ↓
Auto-fill on reconnection
```

### Storage Schema

```typescript
{
  "kgiton_device_licenses": {
    "DEVICE_ID_1": "LICENSE_KEY_1",
    "DEVICE_ID_2": "LICENSE_KEY_2"
  }
}
```

## Threading Model

### Main Thread Operations
- UI updates
- Event callbacks
- State management

### Background Operations
- BLE scanning
- BLE communication
- Data parsing
- Storage operations

All BLE operations are handled asynchronously to prevent blocking the UI thread.

## Memory Management

### Instance Lifecycle

```typescript
// Creation
const service = new KGiTONScaleService();

// Usage
await service.connect(...);

// Cleanup
service.dispose(); // Call when component unmounts
```

### Resource Cleanup

The `dispose()` method handles:
- Stopping active scans
- Disconnecting devices
- Clearing event handlers
- Destroying BLE manager
- Releasing memory

## Security Architecture

### License Key Security
- Keys stored in AsyncStorage (encrypted by platform)
- Never logged in production builds
- Transmitted over encrypted BLE connection
- Validated on device before use

### BLE Security
- Uses BLE GATT (Generic Attribute Profile)
- No pairing required (custom authentication)
- Local communication only
- No internet connectivity required

## Extension Points

### Custom Hooks (Optional)

Create custom React hooks for specific use cases:

```typescript
function useWeightMonitor() {
  const [weight, setWeight] = useState<WeightData | null>(null);
  
  useEffect(() => {
    service.setEventHandlers({
      onWeightData: setWeight
    });
  }, []);
  
  return weight;
}
```

### Context Provider (Optional)

Share service instance across components:

```typescript
const ScaleContext = createContext<KGiTONScaleService | null>(null);

export const ScaleProvider = ({ children }) => {
  const service = useMemo(() => new KGiTONScaleService(), []);
  
  return (
    <ScaleContext.Provider value={service}>
      {children}
    </ScaleContext.Provider>
  );
};
```

## Performance Considerations

### Optimization Strategies

1. **Single Instance**: Use one service instance per app
2. **Event Throttling**: SDK automatically throttles rapid weight updates
3. **Scan Timeout**: Use appropriate timeout values
4. **Cleanup**: Always call `dispose()` when done
5. **Logging**: Disable logging in production

### Best Practices

- Reuse service instance across components
- Unsubscribe from events when not needed
- Handle errors gracefully
- Test on physical devices only
- Monitor memory usage during long sessions

## Next Steps

- Understand [BLE Communication](./05-ble-communication.md)
- Review [API Reference](./07-api-service.md)
- See [Integration Examples](./15-basic-integration.md)
