# Connection Stability Guide

Guide to maintaining stable BLE connections with KGiTON scales.

## Overview

BLE connections can be unstable due to signal interference, distance, battery levels, and device issues. This guide provides strategies to maintain stable connections.

---

## Connection Monitoring

### Connection State Tracking

```typescript
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const ConnectionMonitor = () => {
  const { connectionState, connectedDevice } = useKGiTONScale();

  useEffect(() => {
    console.log('Connection state changed:', connectionState);
  }, [connectionState]);

  return (
    <View>
      <Text>Status: {connectionState}</Text>
      {connectedDevice && (
        <Text>Device: {connectedDevice.name}</Text>
      )}
    </View>
  );
};
```

### Connection States

```typescript
enum ScaleConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  AUTHENTICATING = 'authenticating',
  CONNECTED = 'connected',
  DISCONNECTING = 'disconnecting',
  ERROR = 'error'
}
```

### State Transitions

```typescript
import { useEffect } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const StateMonitor = () => {
  const { connectionState, service } = useKGiTONScale();

  useEffect(() => {
    const handleStateChange = (newState: ScaleConnectionState) => {
      console.log(`State: ${connectionState} → ${newState}`);
      
      switch (newState) {
        case 'connecting':
          showLoading('Connecting...');
          break;
        case 'authenticating':
          showLoading('Authenticating...');
          break;
        case 'connected':
          hideLoading();
          showSuccess('Connected');
          break;
        case 'disconnected':
          hideLoading();
          showWarning('Disconnected');
          break;
        case 'error':
          hideLoading();
          showError('Connection error');
          break;
      }
    };

    service.on('connectionStateChanged', handleStateChange);

    return () => {
      service.off('connectionStateChanged', handleStateChange);
    };
  }, []);

  return null;
};
```

---

## Automatic Reconnection

### Basic Reconnection

```typescript
import { useEffect, useRef } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const useAutoReconnect = () => {
  const { service, connectionState } = useKGiTONScale();
  const lastDeviceId = useRef<string | null>(null);
  const lastLicenseKey = useRef<string | null>(null);
  const reconnectAttempts = useRef(0);
  const maxAttempts = 5;

  useEffect(() => {
    if (connectionState === 'disconnected' && lastDeviceId.current) {
      handleReconnect();
    }
  }, [connectionState]);

  const connect = async (deviceId: string, licenseKey: string) => {
    lastDeviceId.current = deviceId;
    lastLicenseKey.current = licenseKey;
    reconnectAttempts.current = 0;
    
    await service.connectWithLicenseKey(deviceId, licenseKey);
  };

  const handleReconnect = async () => {
    if (reconnectAttempts.current >= maxAttempts) {
      console.error('Max reconnection attempts reached');
      return;
    }

    reconnectAttempts.current++;
    console.log(`Reconnection attempt ${reconnectAttempts.current}/${maxAttempts}`);

    try {
      await service.connectWithLicenseKey(
        lastDeviceId.current!,
        lastLicenseKey.current!
      );
      reconnectAttempts.current = 0; // Reset on success
    } catch (error) {
      console.error('Reconnection failed:', error);
      // Will retry on next disconnection
    }
  };

  return { connect };
};

// Usage
const MyComponent = () => {
  const { connect } = useAutoReconnect();

  const handleConnect = async () => {
    await connect('DEVICE_ID', 'LICENSE_KEY');
  };

  return (
    <Button title="Connect" onPress={handleConnect} />
  );
};
```

### Advanced Reconnection Strategy

```typescript
class ReconnectionManager {
  private deviceId: string | null = null;
  private licenseKey: string | null = null;
  private attempts = 0;
  private maxAttempts = 5;
  private baseDelay = 1000;
  private maxDelay = 30000;
  private reconnecting = false;

  constructor(private service: KGiTONScaleService) {
    this.setupListeners();
  }

  private setupListeners() {
    this.service.on('disconnected', () => {
      this.handleDisconnection();
    });

    this.service.on('connected', () => {
      this.attempts = 0; // Reset on successful connection
    });
  }

  async connect(deviceId: string, licenseKey: string) {
    this.deviceId = deviceId;
    this.licenseKey = licenseKey;
    this.attempts = 0;

    await this.service.connectWithLicenseKey(deviceId, licenseKey);
  }

  private async handleDisconnection() {
    if (this.reconnecting || !this.deviceId || !this.licenseKey) {
      return;
    }

    if (this.attempts >= this.maxAttempts) {
      console.error('Max reconnection attempts reached');
      this.notifyMaxAttemptsReached();
      return;
    }

    this.reconnecting = true;
    this.attempts++;

    const delay = this.calculateDelay();
    console.log(`Reconnecting in ${delay}ms (attempt ${this.attempts}/${this.maxAttempts})`);

    await this.sleep(delay);

    try {
      await this.service.connectWithLicenseKey(this.deviceId, this.licenseKey);
      console.log('Reconnection successful');
      this.reconnecting = false;
    } catch (error) {
      console.error('Reconnection failed:', error);
      this.reconnecting = false;
      // Will retry on next disconnection event
    }
  }

  private calculateDelay(): number {
    // Exponential backoff with jitter
    const exponentialDelay = Math.min(
      this.baseDelay * Math.pow(2, this.attempts - 1),
      this.maxDelay
    );
    
    const jitter = Math.random() * 1000;
    return exponentialDelay + jitter;
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private notifyMaxAttemptsReached() {
    // Emit event or show notification
    Alert.alert(
      'Connection Lost',
      'Unable to reconnect to device. Please reconnect manually.',
      [
        { text: 'OK' },
        { text: 'Retry', onPress: () => this.retryConnection() }
      ]
    );
  }

  async retryConnection() {
    this.attempts = 0;
    await this.handleDisconnection();
  }

  dispose() {
    this.deviceId = null;
    this.licenseKey = null;
    this.attempts = 0;
    this.reconnecting = false;
  }
}

// Usage
const service = new KGiTONScaleService();
const reconnectionManager = new ReconnectionManager(service);

await reconnectionManager.connect('DEVICE_ID', 'LICENSE_KEY');
```

---

## Signal Strength Monitoring

### RSSI Tracking

```typescript
import { useEffect, useState } from 'react';
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const useSignalStrength = () => {
  const { connectedDevice, service } = useKGiTONScale();
  const [rssi, setRssi] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');

  useEffect(() => {
    if (!connectedDevice) return;

    const interval = setInterval(async () => {
      try {
        const device = await service.getConnectedDevice();
        if (device?.rssi) {
          setRssi(device.rssi);
          setSignalQuality(getSignalQuality(device.rssi));
        }
      } catch (error) {
        console.error('Failed to get RSSI:', error);
      }
    }, 5000); // Check every 5 seconds

    return () => clearInterval(interval);
  }, [connectedDevice]);

  const getSignalQuality = (rssi: number) => {
    if (rssi >= -50) return 'excellent';
    if (rssi >= -70) return 'good';
    if (rssi >= -85) return 'fair';
    return 'poor';
  };

  return { rssi, signalQuality };
};

// UI Component
const SignalIndicator = () => {
  const { rssi, signalQuality } = useSignalStrength();

  const colors = {
    excellent: '#4CAF50',
    good: '#8BC34A',
    fair: '#FFC107',
    poor: '#F44336'
  };

  if (!rssi) return null;

  return (
    <View style={styles.container}>
      <View style={[styles.indicator, { backgroundColor: colors[signalQuality] }]} />
      <Text style={styles.text}>
        {signalQuality.toUpperCase()} ({rssi} dBm)
      </Text>
    </View>
  );
};
```

### Signal Quality Warnings

```typescript
const useSignalWarnings = () => {
  const { rssi, signalQuality } = useSignalStrength();
  const hasWarned = useRef(false);

  useEffect(() => {
    if (signalQuality === 'poor' && !hasWarned.current) {
      Alert.alert(
        'Weak Signal',
        'The connection signal is weak. Move closer to the device for better stability.',
        [{ text: 'OK' }]
      );
      hasWarned.current = true;
    } else if (signalQuality !== 'poor') {
      hasWarned.current = false;
    }
  }, [signalQuality]);
};
```

---

## Keepalive Mechanism

### Heartbeat Implementation

```typescript
class KeepAliveManager {
  private interval: NodeJS.Timeout | null = null;
  private heartbeatIntervalMs = 30000; // 30 seconds
  private missedHeartbeats = 0;
  private maxMissedHeartbeats = 3;

  constructor(private service: KGiTONScaleService) {}

  start() {
    this.stop(); // Clear any existing interval
    
    this.interval = setInterval(() => {
      this.sendHeartbeat();
    }, this.heartbeatIntervalMs);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.missedHeartbeats = 0;
  }

  private async sendHeartbeat() {
    try {
      // Send a lightweight command to verify connection
      await this.service.ping(); // If SDK supports ping
      
      // Or use a read operation
      // await this.service.getLastWeight();
      
      this.missedHeartbeats = 0;
      console.log('Heartbeat: OK');
    } catch (error) {
      this.missedHeartbeats++;
      console.warn(`Heartbeat failed (${this.missedHeartbeats}/${this.maxMissedHeartbeats})`);

      if (this.missedHeartbeats >= this.maxMissedHeartbeats) {
        console.error('Connection appears dead, triggering reconnection');
        this.handleConnectionLost();
      }
    }
  }

  private handleConnectionLost() {
    this.stop();
    // Trigger reconnection logic
    this.service.emit('connectionLost');
  }
}

// Usage
const service = new KGiTONScaleService();
const keepAlive = new KeepAliveManager(service);

service.on('connected', () => {
  keepAlive.start();
});

service.on('disconnected', () => {
  keepAlive.stop();
});
```

---

## Connection Quality Metrics

### Metrics Collection

```typescript
interface ConnectionMetrics {
  connectTime: number;
  disconnectCount: number;
  totalUptime: number;
  averageLatency: number;
  packetLoss: number;
  lastRssi: number;
}

class MetricsCollector {
  private metrics: ConnectionMetrics = {
    connectTime: 0,
    disconnectCount: 0,
    totalUptime: 0,
    averageLatency: 0,
    packetLoss: 0,
    lastRssi: 0
  };

  private connectionStartTime: number = 0;
  private latencies: number[] = [];
  private totalPackets = 0;
  private lostPackets = 0;

  onConnected() {
    this.connectionStartTime = Date.now();
    this.metrics.connectTime = this.connectionStartTime;
  }

  onDisconnected() {
    if (this.connectionStartTime > 0) {
      const uptime = Date.now() - this.connectionStartTime;
      this.metrics.totalUptime += uptime;
      this.metrics.disconnectCount++;
      this.connectionStartTime = 0;
    }
  }

  recordLatency(latency: number) {
    this.latencies.push(latency);
    if (this.latencies.length > 100) {
      this.latencies.shift(); // Keep last 100
    }
    
    this.metrics.averageLatency = 
      this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }

  recordPacket(success: boolean) {
    this.totalPackets++;
    if (!success) {
      this.lostPackets++;
    }
    
    this.metrics.packetLoss = 
      (this.lostPackets / this.totalPackets) * 100;
  }

  updateRssi(rssi: number) {
    this.metrics.lastRssi = rssi;
  }

  getMetrics(): ConnectionMetrics {
    return { ...this.metrics };
  }

  reset() {
    this.metrics = {
      connectTime: 0,
      disconnectCount: 0,
      totalUptime: 0,
      averageLatency: 0,
      packetLoss: 0,
      lastRssi: 0
    };
    this.latencies = [];
    this.totalPackets = 0;
    this.lostPackets = 0;
  }
}

// Usage
const collector = new MetricsCollector();

service.on('connected', () => collector.onConnected());
service.on('disconnected', () => collector.onDisconnected());
service.on('weight', (data) => {
  const latency = Date.now() - data.timestamp;
  collector.recordLatency(latency);
  collector.recordPacket(true);
});

// Display metrics
const MetricsDisplay = () => {
  const [metrics, setMetrics] = useState(collector.getMetrics());

  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(collector.getMetrics());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <View>
      <Text>Disconnects: {metrics.disconnectCount}</Text>
      <Text>Uptime: {(metrics.totalUptime / 1000).toFixed(0)}s</Text>
      <Text>Avg Latency: {metrics.averageLatency.toFixed(0)}ms</Text>
      <Text>Packet Loss: {metrics.packetLoss.toFixed(2)}%</Text>
      <Text>RSSI: {metrics.lastRssi} dBm</Text>
    </View>
  );
};
```

---

## Connection Stability Best Practices

### 1. Distance Management

```typescript
const useProximityWarning = () => {
  const { rssi } = useSignalStrength();
  const [isNearby, setIsNearby] = useState(true);

  useEffect(() => {
    if (rssi && rssi < -85) {
      setIsNearby(false);
      showProximityWarning();
    } else {
      setIsNearby(true);
    }
  }, [rssi]);

  return { isNearby };
};

const showProximityWarning = () => {
  Alert.alert(
    'Device Far Away',
    'You may be too far from the scale. Connection may be unstable.',
    [{ text: 'OK' }]
  );
};
```

### 2. Battery Monitoring

```typescript
const useBatteryMonitoring = () => {
  const { service } = useKGiTONScale();
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const level = await service.getBatteryLevel();
        setBatteryLevel(level);

        if (level < 20) {
          Alert.alert(
            'Low Battery',
            'Device battery is low. Connection may become unstable.',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Failed to get battery level:', error);
      }
    }, 60000); // Check every minute

    return () => clearInterval(interval);
  }, []);

  return { batteryLevel };
};
```

### 3. Background Connection Handling

```typescript
import { AppState } from 'react-native';

const useBackgroundHandling = () => {
  const { service, disconnect } = useKGiTONScale();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (
        appState.current.match(/active/) &&
        nextAppState === 'background'
      ) {
        console.log('App going to background');
        // Optionally maintain connection or disconnect
        // service.pauseConnection();
      }

      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('App coming to foreground');
        // Reconnect if needed
        // service.resumeConnection();
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);
};
```

### 4. Error Recovery

```typescript
const useConnectionRecovery = () => {
  const { service, connectionState } = useKGiTONScale();
  const [recovering, setRecovering] = useState(false);

  useEffect(() => {
    if (connectionState === 'error' && !recovering) {
      handleRecovery();
    }
  }, [connectionState]);

  const handleRecovery = async () => {
    setRecovering(true);

    try {
      // Step 1: Cleanup
      await service.dispose();
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 2: Reinitialize
      // (SDK handles this internally)

      // Step 3: Reconnect
      // User must trigger reconnection

      setRecovering(false);
    } catch (error) {
      console.error('Recovery failed:', error);
      setRecovering(false);
    }
  };

  return { recovering };
};
```

---

## Troubleshooting Connection Issues

### Common Issues

#### 1. Frequent Disconnections

**Symptoms:**
- Connection drops every few minutes
- "Device disconnected" errors

**Solutions:**
```typescript
// Check signal strength
const { rssi } = useSignalStrength();
if (rssi < -85) {
  console.warn('Weak signal, move closer');
}

// Enable keepalive
const keepAlive = new KeepAliveManager(service);
keepAlive.start();

// Reduce scan intervals
// Stop scanning when connected
if (connectionState === 'connected') {
  stopScan();
}
```

#### 2. Cannot Reconnect

**Symptoms:**
- Initial connection works
- Reconnection attempts fail

**Solutions:**
```typescript
// Full cleanup before reconnection
await service.dispose();
await new Promise(resolve => setTimeout(resolve, 2000));

// Rescan for device
const devices = await service.scanForDevices(15000);
const device = devices.find(d => d.id === targetDeviceId);

if (device) {
  await service.connectWithLicenseKey(device.id, licenseKey);
}
```

#### 3. Connection Timeout

**Symptoms:**
- Connection attempt times out
- "Connection timeout" error

**Solutions:**
```typescript
// Increase timeout
const timeout = 30000; // 30 seconds
await service.connectWithLicenseKey(deviceId, licenseKey, { timeout });

// Check device availability
const devices = await service.scanForDevices(15000);
if (!devices.find(d => d.id === deviceId)) {
  throw new Error('Device not found');
}

// Check Bluetooth is enabled
const isEnabled = await service.isBluetoothEnabled();
if (!isEnabled) {
  await service.enableBluetooth();
}
```

---

## Performance Optimization

### Connection Caching

```typescript
class ConnectionCache {
  private cache = new Map<string, {
    device: ScaleDevice;
    timestamp: number;
  }>();

  private maxAge = 60000; // 1 minute

  set(deviceId: string, device: ScaleDevice) {
    this.cache.set(deviceId, {
      device,
      timestamp: Date.now()
    });
  }

  get(deviceId: string): ScaleDevice | null {
    const cached = this.cache.get(deviceId);
    
    if (!cached) return null;
    
    if (Date.now() - cached.timestamp > this.maxAge) {
      this.cache.delete(deviceId);
      return null;
    }
    
    return cached.device;
  }

  clear() {
    this.cache.clear();
  }
}

// Usage
const cache = new ConnectionCache();

const connectSmart = async (deviceId: string, licenseKey: string) => {
  let device = cache.get(deviceId);
  
  if (!device) {
    const devices = await service.scanForDevices(15000);
    device = devices.find(d => d.id === deviceId);
    
    if (device) {
      cache.set(deviceId, device);
    }
  }
  
  if (device) {
    await service.connectWithLicenseKey(device.id, licenseKey);
  }
};
```

---

## See Also

- [Error Handling](./11-error-handling.md)
- [Performance Guide](./13-performance.md)
- [Troubleshooting](./19-troubleshooting.md)
