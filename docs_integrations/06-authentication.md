# Authentication & Licensing

Understanding the authentication system and license key management in the KGiTON SDK.

## Overview

The KGiTON SDK uses a license-based authentication system to ensure that only authorized applications can connect to and communicate with KGiTON scale devices. This provides security, usage tracking, and access control.

## Authentication Flow

### Complete Authentication Process

```
┌─────────────────────────────────────────────────────────────┐
│                   Authentication Flow                        │
└─────────────────────────────────────────────────────────────┘

1. User calls connectWithLicenseKey(deviceId, licenseKey)
                    ↓
2. SDK validates license key format locally
                    ↓
3. SDK establishes BLE connection to device
                    ↓
4. SDK discovers GATT services and characteristics
                    ↓
5. SDK subscribes to control characteristic
                    ↓
6. SDK encodes license key to Base64
                    ↓
7. SDK sends authentication command:
   {
     "cmd": "AUTH",
     "key": "BASE64_LICENSE_KEY"
   }
                    ↓
8. Device validates license key
                    ↓
9. Device sends response via notification:
   {
     "cmd": "AUTH",
     "success": true/false,
     "message": "..."
   }
                    ↓
10. If successful:
    - SDK saves license key to AsyncStorage
    - SDK subscribes to weight data notifications
    - State changes to AUTHENTICATED
    - User callback receives success response
                    ↓
11. If failed:
    - SDK disconnects
    - State changes to DISCONNECTED
    - User callback receives error
```

## License Key Format

### Standard Format

License keys follow this format:

```
XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
```

**Characteristics:**
- 5 segments of 5 characters each
- Separated by hyphens (-)
- Total length: 29 characters
- Alphanumeric characters (A-Z, 0-9)

**Example:**
```
AB123-CD456-EF789-GH012-IJ345
```

### License Key Validation

The SDK validates license keys before sending to device:

```typescript
function isValidLicenseKey(key: string): boolean {
  // Check format: XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
  const pattern = /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/;
  return pattern.test(key);
}
```

**Valid:**
```typescript
"AB123-CD456-EF789-GH012-IJ345"  ✅
"AAAAA-BBBBB-CCCCC-DDDDD-EEEEE"  ✅
```

**Invalid:**
```typescript
"AB123-CD456"                     ❌ Too short
"ab123-cd456-ef789-gh012-ij345"  ❌ Lowercase
"AB123_CD456_EF789_GH012_IJ345"  ❌ Wrong separator
```

## Obtaining License Keys

### For Development

Contact PT KGiTON to request development license keys:

📧 **Email**: support@kgiton.com  
📋 **Subject**: "Development License Key Request"  
📝 **Include**:
- Developer name and company
- Project description
- Intended use case
- Expected timeline

**Typical Response Time**: 1-2 business days

### For Production

Production license keys require a formal licensing agreement:

1. **Contact Sales**: sales@kgiton.com
2. **Discuss Requirements**: Number of devices, use case, scale
3. **Review Agreement**: Terms, pricing, support level
4. **Sign Contract**: Licensing agreement
5. **Receive Keys**: Production license keys

### License Types

| Type | Purpose | Validity | Devices |
|------|---------|----------|---------|
| **Development** | Testing, development | Time-limited | Limited |
| **Production** | Live applications | Perpetual | As contracted |
| **Trial** | Evaluation | 30 days | 1-3 devices |
| **Enterprise** | Large deployments | Custom | Unlimited |

## Using License Keys

### Basic Authentication

```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

const service = new KGiTONScaleService();

// Connect with license key
const response = await service.connectWithLicenseKey(
  'DEVICE_ID_HERE',
  'AB123-CD456-EF789-GH012-IJ345'
);

if (response.success) {
  console.log('Authenticated!');
} else {
  console.error('Authentication failed:', response.message);
}
```

### Handling Authentication Responses

```typescript
const handleConnect = async (deviceId: string, licenseKey: string) => {
  try {
    const response = await service.connectWithLicenseKey(
      deviceId,
      licenseKey
    );
    
    if (response.success) {
      // Success - can now receive weight data
      Alert.alert('Success', 'Connected and authenticated');
    } else {
      // Failed - check license key
      Alert.alert('Authentication Failed', response.message);
    }
  } catch (error: any) {
    // Error during connection
    if (error instanceof LicenseKeyException) {
      Alert.alert('Invalid License', error.message);
    } else if (error instanceof BLEConnectionException) {
      Alert.alert('Connection Error', error.message);
    } else {
      Alert.alert('Error', error.message);
    }
  }
};
```

## License Key Storage

### Automatic Persistence

The SDK automatically stores valid license keys after successful authentication:

```typescript
// After successful authentication, SDK automatically:
await AsyncStorage.setItem('kgiton_device_licenses', JSON.stringify({
  [deviceId]: licenseKey
}));
```

### Storage Format

```json
{
  "DEVICE_ID_1": "AB123-CD456-EF789-GH012-IJ345",
  "DEVICE_ID_2": "XY789-ZW456-UV123-TS890-RQ567"
}
```

### Retrieving Stored Keys

```typescript
// SDK automatically checks for stored keys
const devices = service.getAvailableDevices();

// Devices with stored keys have licenseKey property
devices.forEach(device => {
  if (device.licenseKey) {
    console.log(`${device.name} has stored license`);
  }
});
```

### Manual Storage Management

While the SDK handles storage automatically, you can manage keys manually:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save license key
async function saveLicenseKey(deviceId: string, key: string) {
  const existing = await AsyncStorage.getItem('kgiton_device_licenses');
  const licenses = existing ? JSON.parse(existing) : {};
  
  licenses[deviceId] = key;
  
  await AsyncStorage.setItem(
    'kgiton_device_licenses',
    JSON.stringify(licenses)
  );
}

// Retrieve license key
async function getLicenseKey(deviceId: string): Promise<string | null> {
  const existing = await AsyncStorage.getItem('kgiton_device_licenses');
  if (!existing) return null;
  
  const licenses = JSON.parse(existing);
  return licenses[deviceId] || null;
}

// Remove license key
async function removeLicenseKey(deviceId: string) {
  const existing = await AsyncStorage.getItem('kgiton_device_licenses');
  if (!existing) return;
  
  const licenses = JSON.parse(existing);
  delete licenses[deviceId];
  
  await AsyncStorage.setItem(
    'kgiton_device_licenses',
    JSON.stringify(licenses)
  );
}
```

## Security Best Practices

### DO ✅

1. **Never hardcode license keys in source code**
   ```typescript
   // ❌ BAD
   const LICENSE_KEY = 'AB123-CD456-EF789-GH012-IJ345';
   
   // ✅ GOOD
   const LICENSE_KEY = await SecureStore.getItemAsync('license_key');
   ```

2. **Use environment variables for development**
   ```typescript
   // .env file
   DEV_LICENSE_KEY=AB123-CD456-EF789-GH012-IJ345
   
   // In code
   const key = __DEV__ 
     ? process.env.DEV_LICENSE_KEY 
     : await getUserLicenseKey();
   ```

3. **Store keys securely**
   ```typescript
   // Use secure storage on device
   import * as SecureStore from 'expo-secure-store';
   
   await SecureStore.setItemAsync('license_key', licenseKey);
   ```

4. **Validate keys before use**
   ```typescript
   if (!isValidLicenseKey(key)) {
     throw new LicenseKeyException('Invalid license key format');
   }
   ```

5. **Handle authentication failures gracefully**
   ```typescript
   if (!response.success) {
     logAuthenticationFailure(deviceId, response.message);
     showUserFriendlyError();
   }
   ```

### DON'T ❌

1. **Don't commit keys to version control**
   ```bash
   # Add to .gitignore
   .env
   .env.local
   config/secrets.ts
   ```

2. **Don't log license keys**
   ```typescript
   // ❌ BAD
   console.log('Using license:', licenseKey);
   
   // ✅ GOOD
   console.log('License loaded:', licenseKey ? 'Yes' : 'No');
   ```

3. **Don't share keys publicly**
   - Don't post in GitHub issues
   - Don't include in crash reports
   - Don't share in public forums

4. **Don't transmit keys over insecure channels**
   - Use HTTPS for any key transmission
   - Avoid sending via SMS or email
   - Use secure key distribution systems

## License Management UI

### License Input Component

```typescript
import React, { useState } from 'react';
import { View, TextInput, Button, Alert } from 'react-native';

const LicenseKeyInput = ({ onSubmit }) => {
  const [key, setKey] = useState('');
  const [loading, setLoading] = useState(false);

  const formatLicenseKey = (text: string) => {
    // Auto-format as user types
    const cleaned = text.replace(/[^A-Z0-9]/g, '').toUpperCase();
    const parts = cleaned.match(/.{1,5}/g) || [];
    return parts.join('-').substr(0, 29);
  };

  const handleSubmit = async () => {
    if (key.length !== 29) {
      Alert.alert('Error', 'Please enter a complete license key');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(key);
    } catch (error: any) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View>
      <TextInput
        value={key}
        onChangeText={(text) => setKey(formatLicenseKey(text))}
        placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
        maxLength={29}
        autoCapitalize="characters"
        autoCorrect={false}
        style={{
          borderWidth: 1,
          padding: 10,
          fontFamily: 'monospace',
          fontSize: 16,
        }}
      />
      <Button
        title={loading ? 'Connecting...' : 'Connect'}
        onPress={handleSubmit}
        disabled={loading || key.length !== 29}
      />
    </View>
  );
};
```

### Stored License Management

```typescript
const LicenseManager = () => {
  const [licenses, setLicenses] = useState<Record<string, string>>({});

  useEffect(() => {
    loadLicenses();
  }, []);

  const loadLicenses = async () => {
    const stored = await AsyncStorage.getItem('kgiton_device_licenses');
    if (stored) {
      setLicenses(JSON.parse(stored));
    }
  };

  const removeLicense = async (deviceId: string) => {
    const updated = { ...licenses };
    delete updated[deviceId];
    
    await AsyncStorage.setItem(
      'kgiton_device_licenses',
      JSON.stringify(updated)
    );
    setLicenses(updated);
  };

  return (
    <View>
      <Text>Stored Licenses</Text>
      {Object.entries(licenses).map(([deviceId, key]) => (
        <View key={deviceId}>
          <Text>{deviceId}</Text>
          <Text>{key}</Text>
          <Button
            title="Remove"
            onPress={() => removeLicense(deviceId)}
          />
        </View>
      ))}
    </View>
  );
};
```

## Authentication Errors

### Common Error Types

```typescript
import {
  LicenseKeyException,
  AuthenticationException,
  BLEConnectionException
} from '@kgiton/react-native-sdk';

try {
  await service.connectWithLicenseKey(deviceId, licenseKey);
} catch (error) {
  if (error instanceof LicenseKeyException) {
    // Invalid license key format
    console.error('License key format is invalid');
  } else if (error instanceof AuthenticationException) {
    // Authentication rejected by device
    console.error('License key rejected by device');
  } else if (error instanceof BLEConnectionException) {
    // BLE connection issue
    console.error('Failed to connect to device');
  }
}
```

### Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Invalid license key format` | Key doesn't match pattern | Check key format |
| `Authentication failed` | Device rejected key | Verify key is valid |
| `License key expired` | Trial/time-limited key expired | Request new key |
| `Device not authorized` | Device not licensed for this key | Contact support |
| `Connection timeout` | Device unreachable | Check device power and range |

## Disconnection with License

### Proper Disconnect

```typescript
// Disconnect with license key (proper way)
await service.disconnectWithLicenseKey(licenseKey);

// This sends proper disconnect command to device
// Device can log the disconnect
// Cleaner connection state
```

### Force Disconnect

```typescript
// Force disconnect (without license)
await service.disconnect();

// Use only when:
// - License key not available
// - Device not responding
// - Emergency disconnect needed
```

## Multi-Device Authentication

### Current Limitation

The SDK currently supports **one device at a time**:

```typescript
// ✅ Supported
await service.connectWithLicenseKey(device1Id, key1);
// ... use device 1
await service.disconnect();

await service.connectWithLicenseKey(device2Id, key2);
// ... use device 2

// ❌ Not supported
await service.connectWithLicenseKey(device1Id, key1);
await service.connectWithLicenseKey(device2Id, key2); // Will fail
```

### Future Support

Multi-device support is planned for future versions. For now, manage devices sequentially.

## Compliance & Legal

### Terms of Use

By using license keys, you agree to:
- Use keys only for authorized purposes
- Not share keys with unauthorized parties
- Not reverse engineer the authentication system
- Comply with PT KGiTON terms and conditions

### License Validation

PT KGiTON may:
- Validate license key usage
- Revoke keys for violations
- Track key usage for analytics
- Require key renewal for updates

## Troubleshooting

### Authentication Fails

**Problem**: Connection succeeds but authentication fails

**Solutions**:
1. Verify license key is typed correctly
2. Check key hasn't expired
3. Ensure key is for this device
4. Contact support for key validation

### Key Not Saved

**Problem**: License key not persisting

**Solutions**:
1. Check AsyncStorage permissions
2. Verify storage isn't full
3. Check for AsyncStorage errors
4. Try manual save/load

### Multiple Devices Same Key

**Problem**: Using same key for multiple devices

**Solution**: Each device may require unique key. Check with PT KGiTON for multi-device licensing.

## Next Steps

- Review [API Reference](./07-api-service.md)
- Learn about [Error Handling](./11-error-handling.md)
- See [Security Guidelines](../SECURITY.md)
- Read [Authorization Policy](../AUTHORIZATION.md)
