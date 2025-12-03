# BLE Communication

Understanding how Bluetooth Low Energy (BLE) communication works in the KGiTON SDK.

## Overview

The KGiTON SDK uses Bluetooth Low Energy (BLE) to communicate with ESP32-based scale devices. BLE is designed for low-power, intermittent data transmission, making it ideal for IoT devices like scales.

## BLE Fundamentals

### What is BLE?

Bluetooth Low Energy (BLE), also known as Bluetooth Smart, is a wireless personal area network technology designed for novel applications in healthcare, fitness, security, and home entertainment industries.

**Key Characteristics:**
- **Low Power**: Optimized for battery-powered devices
- **Short Range**: Typically 10-30 meters
- **Low Bandwidth**: ~1 Mbps (suitable for periodic small data)
- **Fast Connection**: Quick pairing and data exchange

### BLE vs Classic Bluetooth

| Feature | BLE | Classic Bluetooth |
|---------|-----|-------------------|
| Power Consumption | Very Low | High |
| Range | 10-30m | 10-100m |
| Data Rate | 1 Mbps | 1-3 Mbps |
| Pairing Time | < 6ms | Up to 6s |
| Use Case | Sensors, IoT | Audio, File Transfer |

## BLE Architecture in KGiTON SDK

### GATT Profile

The SDK uses GATT (Generic Attribute Profile) for communication:

```
┌─────────────────────────────────────────────┐
│           KGiTON Scale Device               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────────────────────────────────┐   │
│  │     GATT Server (ESP32)             │   │
│  ├─────────────────────────────────────┤   │
│  │                                     │   │
│  │  Service: KGiTON Scale Service      │   │
│  │  UUID: [SERVICE_UUID]               │   │
│  │                                     │   │
│  │  ├── Characteristic: Weight Data   │   │
│  │  │   UUID: [WEIGHT_UUID]           │   │
│  │  │   Properties: NOTIFY            │   │
│  │  │   → Sends weight measurements   │   │
│  │  │                                 │   │
│  │  ├── Characteristic: Control       │   │
│  │  │   UUID: [CONTROL_UUID]          │   │
│  │  │   Properties: WRITE, NOTIFY     │   │
│  │  │   → Authentication & commands   │   │
│  │  │                                 │   │
│  │  └── Characteristic: Buzzer        │   │
│  │      UUID: [BUZZER_UUID]           │   │
│  │      Properties: WRITE              │   │
│  │      → Buzzer control commands     │   │
│  │                                     │   │
│  └─────────────────────────────────────┘   │
│                                             │
└─────────────────────────────────────────────┘
                    ▲
                    │ BLE Connection
                    │
┌───────────────────┴─────────────────────────┐
│        React Native App (GATT Client)       │
│              KGiTON SDK                     │
└─────────────────────────────────────────────┘
```

### BLE Components

#### 1. Service
A collection of characteristics and their behaviors. KGiTON scale has one primary service.

```typescript
const SERVICE_UUID = 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx';
```

#### 2. Characteristics
Endpoints for reading, writing, or receiving notifications.

**Weight Data Characteristic:**
- **UUID**: Weight characteristic UUID
- **Properties**: NOTIFY (device → app)
- **Purpose**: Stream weight measurements
- **Data Format**: JSON string

**Control Characteristic:**
- **UUID**: Control characteristic UUID
- **Properties**: WRITE, NOTIFY (bidirectional)
- **Purpose**: Authentication and control commands
- **Data Format**: JSON string

**Buzzer Characteristic:**
- **UUID**: Buzzer characteristic UUID
- **Properties**: WRITE (app → device)
- **Purpose**: Buzzer control
- **Data Format**: String command

#### 3. Descriptors
Metadata about characteristics (handled automatically by SDK).

## Communication Flow

### Device Discovery

```
User triggers scan
       ↓
SDK starts BLE scan
       ↓
BLE Manager scans for advertising devices
       ↓
Filters devices by service UUID
       ↓
Collects device info (name, ID, RSSI)
       ↓
Emits onDevicesFound event
       ↓
User receives device list
```

**Code Example:**
```typescript
await service.scanForDevices(15000); // 15 second timeout

// SDK automatically:
// 1. Starts BLE scan
// 2. Filters KGiTON devices
// 3. Measures signal strength (RSSI)
// 4. Deduplicates devices
// 5. Emits found devices
```

### Connection & Authentication

```
User initiates connection
       ↓
SDK connects to device via BLE
       ↓
Discovers services
       ↓
Discovers characteristics
       ↓
Subscribe to control characteristic
       ↓
Send authentication request with license key
       ↓
Device validates license key
       ↓
Device responds with success/failure
       ↓
If successful, subscribe to weight data
       ↓
Connection established
```

**Code Example:**
```typescript
const response = await service.connectWithLicenseKey(
  deviceId,
  licenseKey
);

// SDK automatically:
// 1. Establishes BLE connection
// 2. Discovers GATT services
// 3. Finds required characteristics
// 4. Sets up notifications
// 5. Sends encrypted license key
// 6. Waits for authentication response
// 7. Configures data streaming
```

### Weight Data Streaming

```
Scale measures weight
       ↓
ESP32 updates weight characteristic
       ↓
BLE sends notification to app
       ↓
SDK receives BLE notification
       ↓
Parse and validate data
       ↓
Create WeightData object
       ↓
Emit onWeightData event
       ↓
User receives weight data
```

**Data Format:**
```json
{
  "weight": 12.345,
  "unit": "kg",
  "timestamp": 1638360000000
}
```

**Code Example:**
```typescript
service.setEventHandlers({
  onWeightData: (data) => {
    // Received ~10 times per second
    console.log(`Weight: ${data.weight} kg`);
  }
});
```

### Buzzer Control

```
User triggers buzzer
       ↓
SDK validates command
       ↓
Write to buzzer characteristic
       ↓
BLE sends write command
       ↓
Device receives command
       ↓
Device triggers buzzer
       ↓
Audio feedback produced
```

**Code Example:**
```typescript
await service.triggerBuzzer('BEEP');

// SDK automatically:
// 1. Validates command format
// 2. Checks authentication status
// 3. Writes to buzzer characteristic
// 4. Waits for write confirmation
```

## Data Formats

### Weight Data (Notification)

**Direction**: Device → App  
**Characteristic**: Weight Data  
**Format**: JSON String

```typescript
{
  "w": 12.345,      // Weight in kg (float)
  "u": "kg",        // Unit (string)
  "t": 1638360000   // Timestamp (unix)
}
```

**Parsed by SDK to:**
```typescript
interface WeightData {
  weight: number;
  unit: string;
  timestamp: number;
  deviceId: string;
}
```

### Authentication Request (Write)

**Direction**: App → Device  
**Characteristic**: Control  
**Format**: JSON String

```typescript
{
  "cmd": "AUTH",
  "key": "BASE64_ENCODED_LICENSE_KEY"
}
```

### Authentication Response (Notification)

**Direction**: Device → App  
**Characteristic**: Control  
**Format**: JSON String

```typescript
{
  "cmd": "AUTH",
  "success": true,
  "message": "Authentication successful"
}
```

### Buzzer Command (Write)

**Direction**: App → Device  
**Characteristic**: Buzzer  
**Format**: Plain String

```typescript
"BEEP"  // or "BUZZ", "LONG", "OFF"
```

## Connection States

### State Machine

```
DISCONNECTED ──scan──> SCANNING
                          │
                          ├──found──> DISCONNECTED
                          └──timeout─> DISCONNECTED

DISCONNECTED ──connect──> CONNECTING
                              │
                              ├──success──> CONNECTED
                              └──fail─────> ERROR ──> DISCONNECTED

CONNECTED ──auth──> AUTHENTICATED
                        │
                        ├──success──> AUTHENTICATED
                        └──fail─────> DISCONNECTED

AUTHENTICATED ──disconnect──> DISCONNECTED
              ──error──────> ERROR ──> DISCONNECTED
```

### State Transitions

```typescript
enum ScaleConnectionState {
  DISCONNECTED = 'DISCONNECTED',    // No connection
  SCANNING = 'SCANNING',            // Actively scanning
  CONNECTING = 'CONNECTING',        // Establishing connection
  CONNECTED = 'CONNECTED',          // Connected, not authenticated
  AUTHENTICATED = 'AUTHENTICATED',  // Connected and authenticated
  ERROR = 'ERROR'                   // Error occurred
}
```

## BLE Characteristics Details

### Characteristic Properties

| Property | Description | Used In |
|----------|-------------|---------|
| **READ** | Can read value | - |
| **WRITE** | Can write value | Control, Buzzer |
| **NOTIFY** | Can receive notifications | Weight, Control |
| **INDICATE** | Can receive indications | - |

### Notification vs Indication

**Notification** (used by SDK):
- Unacknowledged
- Faster
- Lower overhead
- Suitable for frequent data

**Indication** (not used):
- Acknowledged
- Slower
- Higher overhead
- Suitable for critical data

## Connection Parameters

### Scan Parameters

```typescript
{
  scanTimeout: 15000,        // 15 seconds default
  allowDuplicates: false,    // Ignore duplicate advertisements
  scanMode: 'LowLatency'     // Balanced/LowPower/LowLatency
}
```

### Connection Parameters

```typescript
{
  connectionTimeout: 15000,   // 15 seconds
  autoConnect: false,         // Manual connection
  requestMTU: 512            // Maximum transmission unit
}
```

### Notification Setup

```typescript
// SDK automatically subscribes to notifications
await characteristic.monitor((error, characteristic) => {
  if (error) {
    handleError(error);
    return;
  }
  
  const data = base64.decode(characteristic.value);
  processData(data);
});
```

## Error Handling

### Common BLE Errors

| Error | Cause | Solution |
|-------|-------|----------|
| **Connection Timeout** | Device out of range or busy | Retry, check distance |
| **GATT Error 133** | Android BLE stack issue | Retry after delay |
| **Service Not Found** | Wrong device or firmware | Verify device |
| **Characteristic Not Found** | Incompatible firmware | Update firmware |
| **Notification Failed** | Descriptor issue | Reconnect |

### Error Recovery

```typescript
service.setEventHandlers({
  onError: (error) => {
    if (error.message.includes('Connection timeout')) {
      // Retry connection
      setTimeout(() => reconnect(), 2000);
    } else if (error.message.includes('GATT error 133')) {
      // Android specific - wait and retry
      setTimeout(() => reconnect(), 5000);
    }
  }
});
```

## Performance Considerations

### Data Rate

- **Weight Data**: ~10 Hz (10 measurements/second)
- **MTU Size**: 512 bytes (negotiated)
- **Latency**: 30-100ms typical

### Optimization Tips

1. **Reduce scan time**: Use appropriate timeout
2. **Stop scanning when done**: Call `stopScan()`
3. **Disconnect properly**: Use `disconnect()` or `disconnectWithLicenseKey()`
4. **Handle notifications efficiently**: Don't block event handlers
5. **Monitor RSSI**: Maintain good signal strength

### Battery Impact

**App Side:**
- Scanning: High power consumption
- Connected: Low power consumption
- Notifications: Very low power

**Device Side:**
- Advertising: Low power
- Connected: Low power
- Transmitting: Low power

## Platform Differences

### Android

**Advantages:**
- More BLE control
- Background scanning (with limitations)
- Better error reporting

**Challenges:**
- GATT error 133 (stack issues)
- Location permission required
- Varied BLE stack quality across manufacturers

### iOS

**Advantages:**
- Stable BLE stack
- Better background support
- Consistent behavior

**Challenges:**
- Less control over BLE parameters
- Stricter background limitations
- Requires physical device (simulator has no BLE)

## Security

### BLE Security in KGiTON

**Encryption:**
- BLE link layer encryption (AES-128)
- Application layer authentication (license key)

**Authentication:**
- Custom authentication protocol
- License key validation
- No pairing required

**Privacy:**
- Local communication only
- No internet required
- Data not transmitted outside BLE connection

## Debugging BLE

### Enable BLE Logging

```typescript
// Enable SDK logging
const service = new KGiTONScaleService(true);

// SDK will log:
// - BLE state changes
// - Scan results
// - Connection events
// - Data received/sent
// - Errors
```

### Android BLE Debugging

1. Enable Developer Options
2. Enable Bluetooth HCI snoop log
3. Reproduce issue
4. Collect log from `/sdcard/btsnoop_hci.log`
5. Analyze with Wireshark

### iOS BLE Debugging

1. Install Additional Tools for Xcode
2. Open PacketLogger
3. Start capture
4. Reproduce issue
5. Analyze captured packets

## Best Practices

### DO ✅

- Always check Bluetooth is enabled before operations
- Request permissions before scanning
- Stop scanning when done
- Handle connection errors gracefully
- Monitor signal strength (RSSI)
- Test on physical devices only
- Implement timeouts for operations
- Clean up resources with `dispose()`

### DON'T ❌

- Don't scan indefinitely
- Don't ignore permission requests
- Don't test on emulators/simulators
- Don't block event handlers
- Don't ignore connection errors
- Don't connect to multiple devices simultaneously (current limitation)
- Don't forget to disconnect when done

## Troubleshooting

### No devices found

**Check:**
- Bluetooth is enabled
- Permissions are granted
- Device is powered on
- Device is in range
- Device is not connected elsewhere

### Connection fails

**Check:**
- Device is available
- Not already connected
- Signal strength is good (RSSI > -85 dBm)
- License key is correct

### No weight data received

**Check:**
- Device is authenticated (not just connected)
- Notifications are working
- Event handler is set
- Device is functioning properly

## Next Steps

- Learn about [Authentication & Licensing](./06-authentication.md)
- Review [API Reference](./07-api-service.md)
- See [Troubleshooting Guide](./19-troubleshooting.md)
