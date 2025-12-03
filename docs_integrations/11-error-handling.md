# Error Handling Guide

Comprehensive guide to handling errors in the KGiTON SDK.

## Overview

The KGiTON SDK provides a robust error handling system with specific exception types, error recovery mechanisms, and debugging tools.

---

## Exception Types

### Base Exception

All SDK exceptions extend from `KGiTONException`:

```typescript
class KGiTONException extends Error {
  code: string;
  details?: any;
  timestamp: number;
  recoverable: boolean;
}
```

### Available Exceptions

```typescript
import {
  KGiTONException,
  BLEConnectionException,
  AuthenticationException,
  DeviceNotFoundException,
  InvalidLicenseException,
  TimeoutException,
  DataValidationException,
  PermissionDeniedException
} from '@kgiton/react-native-sdk';
```

---

## BLE Connection Exceptions

### BLEConnectionException

Thrown when BLE connection fails.

```typescript
try {
  await service.connectWithLicenseKey('DEVICE_ID', 'LICENSE_KEY');
} catch (error) {
  if (error instanceof BLEConnectionException) {
    console.error('Connection failed:', error.message);
    console.error('Error code:', error.code);
    console.error('Recoverable:', error.recoverable);
    
    if (error.recoverable) {
      // Retry connection
      await retryConnection();
    }
  }
}
```

**Common Codes:**

| Code | Description | Recoverable |
|------|-------------|-------------|
| `BLE_NOT_ENABLED` | Bluetooth is off | Yes |
| `BLE_NOT_AUTHORIZED` | No permission | Yes |
| `CONNECTION_TIMEOUT` | Connection timeout | Yes |
| `DEVICE_DISCONNECTED` | Device disconnected | Yes |
| `CONNECTION_FAILED` | General failure | Maybe |

**Example Recovery:**

```typescript
const handleConnectionError = async (error: BLEConnectionException) => {
  switch (error.code) {
    case 'BLE_NOT_ENABLED':
      Alert.alert(
        'Bluetooth Off',
        'Please enable Bluetooth to continue',
        [{ text: 'OK', onPress: () => openSettings() }]
      );
      break;
      
    case 'CONNECTION_TIMEOUT':
      Alert.alert(
        'Connection Timeout',
        'Device not responding. Try again?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Retry', onPress: () => retryConnection() }
        ]
      );
      break;
      
    case 'DEVICE_DISCONNECTED':
      // Auto-retry for disconnection
      if (retryCount < 3) {
        await delay(2000);
        await retryConnection();
      }
      break;
      
    default:
      Alert.alert('Connection Error', error.message);
  }
};
```

---

## Authentication Exceptions

### AuthenticationException

Thrown when authentication fails.

```typescript
try {
  const response = await service.connectWithLicenseKey(deviceId, licenseKey);
} catch (error) {
  if (error instanceof AuthenticationException) {
    console.error('Auth failed:', error.message);
    console.error('License key:', error.details?.licenseKey);
  }
}
```

**Common Scenarios:**

```typescript
// Invalid license format
try {
  await service.connectWithLicenseKey(deviceId, 'INVALID-FORMAT');
} catch (error) {
  if (error instanceof AuthenticationException) {
    if (error.code === 'INVALID_LICENSE_FORMAT') {
      showError('License key format is invalid');
    }
  }
}

// License not found
try {
  await service.connectWithLicenseKey(deviceId, 'VALID-FORMAT-BUT-NOT-EXISTS');
} catch (error) {
  if (error instanceof AuthenticationException) {
    if (error.code === 'LICENSE_NOT_FOUND') {
      showError('License key not recognized');
    }
  }
}

// License expired
try {
  await service.connectWithLicenseKey(deviceId, expiredLicenseKey);
} catch (error) {
  if (error instanceof AuthenticationException) {
    if (error.code === 'LICENSE_EXPIRED') {
      showError('License key has expired');
    }
  }
}
```

### InvalidLicenseException

Specific exception for license issues:

```typescript
try {
  await service.connectWithLicenseKey(deviceId, licenseKey);
} catch (error) {
  if (error instanceof InvalidLicenseException) {
    console.error('License issue:', error.message);
    console.error('License format:', error.details?.format);
    console.error('Expected format:', error.details?.expectedFormat);
  }
}
```

---

## Device Exceptions

### DeviceNotFoundException

Thrown when device is not found or not available.

```typescript
try {
  await service.connectToDevice('NON_EXISTENT_ID');
} catch (error) {
  if (error instanceof DeviceNotFoundException) {
    Alert.alert(
      'Device Not Found',
      'Please ensure the device is powered on and nearby',
      [
        { text: 'Scan Again', onPress: () => startScan() }
      ]
    );
  }
}
```

**Prevention Pattern:**

```typescript
const connectSafely = async (deviceId: string) => {
  // Check if device exists first
  const devices = await service.scanForDevices(10000);
  const device = devices.find(d => d.id === deviceId);
  
  if (!device) {
    throw new DeviceNotFoundException(
      `Device ${deviceId} not found`,
      { deviceId, availableDevices: devices.length }
    );
  }
  
  // Proceed with connection
  await service.connectToDevice(deviceId);
};
```

---

## Timeout Exceptions

### TimeoutException

Thrown when operations exceed timeout limits.

```typescript
try {
  await service.scanForDevices(5000);
} catch (error) {
  if (error instanceof TimeoutException) {
    console.error('Operation timed out:', error.message);
    console.error('Timeout duration:', error.details?.timeout);
    console.error('Operation:', error.details?.operation);
  }
}
```

**Handling Patterns:**

```typescript
// Scan timeout
const handleScanTimeout = async () => {
  try {
    const devices = await service.scanForDevices(15000);
    if (devices.length === 0) {
      Alert.alert('No Devices Found', 'Try scanning again');
    }
  } catch (error) {
    if (error instanceof TimeoutException) {
      // Scan completed but no devices found
      Alert.alert('Scan Complete', 'No devices detected');
    }
  }
};

// Connection timeout with retry
const connectWithRetry = async (
  deviceId: string, 
  maxRetries = 3
) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await service.connectToDevice(deviceId);
      return; // Success
    } catch (error) {
      if (error instanceof TimeoutException) {
        if (i < maxRetries - 1) {
          console.log(`Retry ${i + 1}/${maxRetries}`);
          await delay(2000);
        } else {
          throw error; // Final attempt failed
        }
      } else {
        throw error; // Different error
      }
    }
  }
};
```

---

## Data Validation Exceptions

### DataValidationException

Thrown when data validation fails.

```typescript
try {
  await service.sendCommand('INVALID_COMMAND');
} catch (error) {
  if (error instanceof DataValidationException) {
    console.error('Validation error:', error.message);
    console.error('Field:', error.details?.field);
    console.error('Value:', error.details?.value);
    console.error('Expected:', error.details?.expected);
  }
}
```

**Validation Scenarios:**

```typescript
// Weight data validation
service.on('weight', (weightData) => {
  try {
    if (weightData.weight < 0) {
      throw new DataValidationException(
        'Negative weight received',
        { weight: weightData.weight }
      );
    }
    
    if (weightData.weight > 500) {
      throw new DataValidationException(
        'Weight exceeds maximum',
        { weight: weightData.weight, max: 500 }
      );
    }
    
    // Valid weight
    processWeight(weightData);
  } catch (error) {
    if (error instanceof DataValidationException) {
      console.warn('Invalid weight data:', error.message);
      // Use fallback or previous value
    }
  }
});

// Command validation
const sendValidatedCommand = async (command: string) => {
  const validCommands = ['BEEP', 'BUZZ', 'LONG', 'TARE'];
  
  if (!validCommands.includes(command)) {
    throw new DataValidationException(
      'Invalid command',
      { 
        command, 
        validCommands,
        message: `Expected one of: ${validCommands.join(', ')}`
      }
    );
  }
  
  await service.triggerBuzzer(command);
};
```

---

## Permission Exceptions

### PermissionDeniedException

Thrown when required permissions are denied.

```typescript
try {
  await service.scanForDevices();
} catch (error) {
  if (error instanceof PermissionDeniedException) {
    console.error('Permission denied:', error.message);
    console.error('Required permissions:', error.details?.permissions);
    
    Alert.alert(
      'Permission Required',
      'Bluetooth permission is required to scan for devices',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => openSettings() }
      ]
    );
  }
}
```

**Permission Check Pattern:**

```typescript
import { PermissionsAndroid, Platform } from 'react-native';

const checkAndRequestPermissions = async () => {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        {
          title: 'Bluetooth Permission',
          message: 'App needs Bluetooth permission to find devices',
          buttonPositive: 'OK'
        }
      );
      
      if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
        throw new PermissionDeniedException(
          'Bluetooth scan permission denied',
          { permission: 'BLUETOOTH_SCAN' }
        );
      }
    } catch (error) {
      if (error instanceof PermissionDeniedException) {
        // Handle permission denial
        showPermissionError();
      }
      throw error;
    }
  }
};
```

---

## Error Recovery Strategies

### Automatic Retry

```typescript
class RetryPolicy {
  maxRetries: number = 3;
  delay: number = 1000;
  backoff: number = 2;

  async execute<T>(
    operation: () => Promise<T>,
    retries: number = 0
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      if (retries >= this.maxRetries) {
        throw error;
      }

      if (error instanceof KGiTONException && error.recoverable) {
        const waitTime = this.delay * Math.pow(this.backoff, retries);
        console.log(`Retry ${retries + 1}/${this.maxRetries} after ${waitTime}ms`);
        
        await new Promise(resolve => setTimeout(resolve, waitTime));
        return this.execute(operation, retries + 1);
      }

      throw error;
    }
  }
}

// Usage
const retry = new RetryPolicy();

await retry.execute(async () => {
  return await service.connectWithLicenseKey(deviceId, licenseKey);
});
```

### Graceful Degradation

```typescript
const getWeightSafely = (): WeightData | null => {
  try {
    const weight = service.getLastWeight();
    return weight;
  } catch (error) {
    console.warn('Failed to get weight:', error);
    // Return cached value or null
    return getCachedWeight() || null;
  }
};
```

### Circuit Breaker

```typescript
class CircuitBreaker {
  private failures = 0;
  private threshold = 5;
  private resetTimeout = 60000; // 1 minute
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailure: number = 0;

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailure > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure() {
    this.failures++;
    this.lastFailure = Date.now();
    
    if (this.failures >= this.threshold) {
      this.state = 'open';
      console.error('Circuit breaker opened due to failures');
    }
  }
}

// Usage
const breaker = new CircuitBreaker();

await breaker.execute(async () => {
  return await service.connectToDevice(deviceId);
});
```

---

## Error Monitoring

### Global Error Handler

```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

const service = new KGiTONScaleService();

// Listen to all errors
service.on('error', (error) => {
  console.error('[SDK Error]', error);
  
  // Log to analytics
  logErrorToAnalytics({
    type: error.constructor.name,
    code: error.code,
    message: error.message,
    timestamp: error.timestamp,
    recoverable: error.recoverable
  });
  
  // Show user notification if critical
  if (!error.recoverable) {
    showCriticalError(error);
  }
});
```

### Error Logging

```typescript
class ErrorLogger {
  private errors: KGiTONException[] = [];

  log(error: KGiTONException) {
    this.errors.push(error);
    
    // Persist to storage
    AsyncStorage.setItem(
      'error_log',
      JSON.stringify(this.errors.slice(-100)) // Keep last 100
    );
    
    // Send to server if critical
    if (!error.recoverable) {
      this.sendToServer(error);
    }
  }

  async sendToServer(error: KGiTONException) {
    try {
      await fetch('https://api.example.com/errors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: {
            type: error.constructor.name,
            code: error.code,
            message: error.message,
            timestamp: error.timestamp,
            details: error.details
          },
          device: {
            platform: Platform.OS,
            version: Platform.Version
          }
        })
      });
    } catch (e) {
      console.error('Failed to send error to server:', e);
    }
  }

  getErrors() {
    return this.errors;
  }

  clear() {
    this.errors = [];
    AsyncStorage.removeItem('error_log');
  }
}

const errorLogger = new ErrorLogger();

// Use in catch blocks
try {
  await service.connectToDevice(deviceId);
} catch (error) {
  if (error instanceof KGiTONException) {
    errorLogger.log(error);
  }
  throw error;
}
```

---

## Error UI Components

### Error Boundary

```typescript
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message}
          </Text>
          <Button
            title="Try Again"
            onPress={() => this.setState({ hasError: false, error: null })}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10
  },
  message: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20
  }
});

export default ErrorBoundary;
```

### Error Alert

```typescript
import { Alert } from 'react-native';
import { KGiTONException } from '@kgiton/react-native-sdk';

const showError = (error: Error) => {
  if (error instanceof KGiTONException) {
    Alert.alert(
      getErrorTitle(error),
      error.message,
      getErrorActions(error)
    );
  } else {
    Alert.alert('Error', error.message);
  }
};

const getErrorTitle = (error: KGiTONException): string => {
  const titles: Record<string, string> = {
    BLEConnectionException: 'Connection Error',
    AuthenticationException: 'Authentication Failed',
    DeviceNotFoundException: 'Device Not Found',
    TimeoutException: 'Operation Timeout',
    PermissionDeniedException: 'Permission Required'
  };
  
  return titles[error.constructor.name] || 'Error';
};

const getErrorActions = (error: KGiTONException) => {
  const actions = [{ text: 'OK', style: 'cancel' }];
  
  if (error.recoverable) {
    actions.push({
      text: 'Retry',
      onPress: () => retryOperation()
    });
  }
  
  return actions;
};
```

---

## Debugging

### Enable Logging

```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

const service = new KGiTONScaleService();

// Enable debug logs
if (__DEV__) {
  service.setDebugLogging(true);
}
```

### Debug Panel

```typescript
import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const DebugPanel = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const { service } = useKGiTONScale();

  useEffect(() => {
    const handleLog = (message: string) => {
      setLogs(prev => [...prev.slice(-50), `[${new Date().toISOString()}] ${message}`]);
    };

    service.on('debug', handleLog);
    service.on('error', (error) => handleLog(`ERROR: ${error.message}`));

    return () => {
      service.off('debug', handleLog);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Debug Logs</Text>
      <ScrollView style={styles.logs}>
        {logs.map((log, index) => (
          <Text key={index} style={styles.log}>{log}</Text>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#000',
    opacity: 0.9
  },
  title: {
    color: '#0f0',
    padding: 8,
    fontWeight: 'bold'
  },
  logs: {
    flex: 1,
    padding: 8
  },
  log: {
    color: '#0f0',
    fontSize: 10,
    fontFamily: 'monospace'
  }
});

export default DebugPanel;
```

---

## Best Practices

### 1. Always Handle Specific Exceptions First

```typescript
// ✅ GOOD
try {
  await service.connect(deviceId, licenseKey);
} catch (error) {
  if (error instanceof AuthenticationException) {
    // Handle auth error
  } else if (error instanceof BLEConnectionException) {
    // Handle connection error
  } else if (error instanceof KGiTONException) {
    // Handle other SDK errors
  } else {
    // Handle unknown errors
  }
}

// ❌ BAD
try {
  await service.connect(deviceId, licenseKey);
} catch (error) {
  console.error(error); // Too generic
}
```

### 2. Check Recoverable Flag

```typescript
try {
  await operation();
} catch (error) {
  if (error instanceof KGiTONException) {
    if (error.recoverable) {
      // Retry logic
      await retryOperation();
    } else {
      // Critical error, inform user
      showCriticalError(error);
    }
  }
}
```

### 3. Provide User Feedback

```typescript
try {
  await service.connect(deviceId, licenseKey);
} catch (error) {
  if (error instanceof KGiTONException) {
    showUserFriendlyError(error);
  }
}

const showUserFriendlyError = (error: KGiTONException) => {
  const messages: Record<string, string> = {
    'BLE_NOT_ENABLED': 'Please turn on Bluetooth',
    'LICENSE_INVALID': 'License key is invalid',
    'CONNECTION_TIMEOUT': 'Device is not responding',
    'DEVICE_NOT_FOUND': 'Device not found. Is it powered on?'
  };
  
  Alert.alert('Error', messages[error.code] || error.message);
};
```

### 4. Log for Debugging

```typescript
const handleError = (error: Error) => {
  // Log to console in development
  if (__DEV__) {
    console.error('[Error]', error);
  }
  
  // Log to service in production
  if (!__DEV__) {
    logToService(error);
  }
  
  // Always show user-friendly message
  showError(error);
};
```

---

## See Also

- [Connection Stability](./12-connection-stability.md)
- [Testing Guide](./14-testing.md)
- [Troubleshooting](./19-troubleshooting.md)
