# Performance Optimization Guide

Comprehensive guide to optimizing performance when using the KGiTON SDK.

## Overview

BLE operations, state management, and UI rendering can impact app performance. This guide provides strategies to optimize your implementation.

---

## Memory Management

### Service Lifecycle

```typescript
import { useEffect } from 'react';
import { KGiTONScaleService } from '@kgiton/react-native-sdk';

// ❌ BAD - Creates new service on every render
const BadComponent = () => {
  const service = new KGiTONScaleService();
  
  return <View />;
};

// ✅ GOOD - Single service instance
import { useKGiTONScale } from '@kgiton/react-native-sdk';

const GoodComponent = () => {
  const { service } = useKGiTONScale();
  
  return <View />;
};
```

### Proper Cleanup

```typescript
const MyComponent = () => {
  const service = useMemo(() => new KGiTONScaleService(), []);

  useEffect(() => {
    // Setup
    service.initialize();

    return () => {
      // Cleanup
      service.dispose();
    };
  }, []);

  return <View />;
};
```

### Event Listener Management

```typescript
// ❌ BAD - Listeners not cleaned up
useEffect(() => {
  service.on('weight', handleWeight);
  service.on('connected', handleConnect);
  // Missing cleanup
}, []);

// ✅ GOOD - Proper cleanup
useEffect(() => {
  const handleWeight = (data: WeightData) => {
    console.log(data);
  };

  const handleConnect = () => {
    console.log('Connected');
  };

  service.on('weight', handleWeight);
  service.on('connected', handleConnect);

  return () => {
    service.off('weight', handleWeight);
    service.off('connected', handleConnect);
  };
}, [service]);
```

---

## State Management Optimization

### Avoid Unnecessary Re-renders

```typescript
// ❌ BAD - Component re-renders on every weight update
const WeightDisplay = () => {
  const { weight } = useKGiTONScale();
  
  return <Text>{weight?.weight}</Text>;
};

// ✅ GOOD - Memo prevents unnecessary re-renders
const WeightDisplay = memo(() => {
  const { weight } = useKGiTONScale();
  
  return <Text>{weight?.weight}</Text>;
});

// ✅ BETTER - Only re-render if weight value changes
const WeightDisplay = () => {
  const { weight } = useKGiTONScale();
  const weightValue = useMemo(() => weight?.weight, [weight?.weight]);
  
  return <Text>{weightValue}</Text>;
};
```

### Selective State Updates

```typescript
// Custom hook for specific state
const useWeightOnly = () => {
  const { service } = useKGiTONScale();
  const [weight, setWeight] = useState<WeightData | null>(null);

  useEffect(() => {
    const handleWeight = (data: WeightData) => setWeight(data);
    service.on('weight', handleWeight);
    return () => service.off('weight', handleWeight);
  }, [service]);

  return weight;
};

// Usage - component only re-renders on weight changes
const Display = () => {
  const weight = useWeightOnly();
  return <Text>{weight?.weight}</Text>;
};
```

### Debouncing Weight Updates

```typescript
import { useMemo, useCallback } from 'react';
import debounce from 'lodash/debounce';

const useDebouncedWeight = (delay = 100) => {
  const { service } = useKGiTONScale();
  const [weight, setWeight] = useState<WeightData | null>(null);

  const debouncedSet = useMemo(
    () => debounce((data: WeightData) => setWeight(data), delay),
    [delay]
  );

  useEffect(() => {
    service.on('weight', debouncedSet);
    return () => {
      service.off('weight', debouncedSet);
      debouncedSet.cancel();
    };
  }, [service, debouncedSet]);

  return weight;
};

// Usage
const SmoothWeightDisplay = () => {
  const weight = useDebouncedWeight(200); // Update max every 200ms
  
  return <Text>{weight?.weight.toFixed(3)}</Text>;
};
```

---

## BLE Operation Optimization

### Batch Operations

```typescript
// ❌ BAD - Multiple individual operations
const sendMultipleCommands = async () => {
  await service.triggerBuzzer('BEEP');
  await service.sendCommand('CMD1');
  await service.sendCommand('CMD2');
};

// ✅ GOOD - Batch operations
const sendMultipleCommands = async () => {
  await Promise.all([
    service.triggerBuzzer('BEEP'),
    service.sendCommand('CMD1'),
    service.sendCommand('CMD2')
  ]);
};
```

### Connection Pooling

```typescript
class ConnectionPool {
  private connections = new Map<string, KGiTONScaleService>();
  private maxConnections = 5;

  async getConnection(deviceId: string): Promise<KGiTONScaleService> {
    if (this.connections.has(deviceId)) {
      return this.connections.get(deviceId)!;
    }

    if (this.connections.size >= this.maxConnections) {
      // Remove oldest connection
      const firstKey = this.connections.keys().next().value;
      const oldConnection = this.connections.get(firstKey);
      await oldConnection?.dispose();
      this.connections.delete(firstKey);
    }

    const service = new KGiTONScaleService();
    this.connections.set(deviceId, service);
    return service;
  }

  async releaseConnection(deviceId: string) {
    const service = this.connections.get(deviceId);
    if (service) {
      await service.disconnect();
      // Keep in pool for reuse
    }
  }

  async dispose() {
    for (const service of this.connections.values()) {
      await service.dispose();
    }
    this.connections.clear();
  }
}
```

### Scan Optimization

```typescript
// ❌ BAD - Continuous scanning
useEffect(() => {
  service.scanForDevices(0); // Never stops
}, []);

// ✅ GOOD - Time-limited scanning
const useScan = (duration = 15000) => {
  const { scan, stopScan } = useKGiTONScale();

  const startScan = useCallback(async () => {
    await scan(duration);
  }, [scan, duration]);

  useEffect(() => {
    return () => stopScan(); // Always cleanup
  }, [stopScan]);

  return { startScan };
};

// ✅ BETTER - Smart scanning (stop when device found)
const useSmartScan = (targetDeviceId?: string) => {
  const { service, devices } = useKGiTONScale();

  useEffect(() => {
    if (targetDeviceId && devices.some(d => d.id === targetDeviceId)) {
      service.stopScan();
    }
  }, [devices, targetDeviceId]);

  return devices;
};
```

---

## Data Processing Optimization

### Weight Data Filtering

```typescript
// Filter out invalid or duplicate readings
const useFilteredWeight = () => {
  const { service } = useKGiTONScale();
  const [weight, setWeight] = useState<WeightData | null>(null);
  const lastWeight = useRef<number>(0);
  const threshold = 0.001; // Minimum change to update

  useEffect(() => {
    const handleWeight = (data: WeightData) => {
      // Validate data
      if (data.weight < 0 || data.weight > 500) {
        console.warn('Invalid weight:', data.weight);
        return;
      }

      // Check if change is significant
      const change = Math.abs(data.weight - lastWeight.current);
      if (change < threshold) {
        return; // Ignore small fluctuations
      }

      lastWeight.current = data.weight;
      setWeight(data);
    };

    service.on('weight', handleWeight);
    return () => service.off('weight', handleWeight);
  }, [service]);

  return weight;
};
```

### Data Caching

```typescript
class WeightDataCache {
  private cache: WeightData[] = [];
  private maxSize = 100;

  add(data: WeightData) {
    this.cache.push(data);
    
    if (this.cache.length > this.maxSize) {
      this.cache.shift(); // Remove oldest
    }
  }

  getLatest(): WeightData | null {
    return this.cache[this.cache.length - 1] || null;
  }

  getAverage(count = 10): number {
    const recent = this.cache.slice(-count);
    const sum = recent.reduce((acc, data) => acc + data.weight, 0);
    return sum / recent.length;
  }

  getSmoothed(windowSize = 5): number {
    const recent = this.cache.slice(-windowSize);
    const sorted = recent.map(d => d.weight).sort((a, b) => a - b);
    
    // Remove outliers (lowest and highest)
    const filtered = sorted.slice(1, -1);
    const sum = filtered.reduce((acc, val) => acc + val, 0);
    
    return sum / filtered.length;
  }

  clear() {
    this.cache = [];
  }
}

// Usage
const cache = new WeightDataCache();

service.on('weight', (data) => {
  cache.add(data);
  
  const smoothed = cache.getSmoothed();
  console.log('Smoothed weight:', smoothed);
});
```

---

## Rendering Optimization

### Virtual Lists for Device List

```typescript
import { FlatList } from 'react-native';

// ❌ BAD - Renders all devices
const DeviceList = ({ devices }) => (
  <ScrollView>
    {devices.map(device => (
      <DeviceItem key={device.id} device={device} />
    ))}
  </ScrollView>
);

// ✅ GOOD - Virtual rendering
const DeviceList = ({ devices }) => (
  <FlatList
    data={devices}
    keyExtractor={(item) => item.id}
    renderItem={({ item }) => <DeviceItem device={item} />}
    initialNumToRender={10}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
  />
);

// ✅ BETTER - Optimized with memo
const DeviceItem = memo(({ device }) => (
  <View>
    <Text>{device.name}</Text>
  </View>
), (prev, next) => prev.device.id === next.device.id);
```

### Animated Weight Display

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring
} from 'react-native-reanimated';

const AnimatedWeightDisplay = () => {
  const weight = useWeightOnly();
  const animatedWeight = useSharedValue(0);

  useEffect(() => {
    if (weight) {
      animatedWeight.value = withSpring(weight.weight);
    }
  }, [weight]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: animatedWeight.value / 100 }]
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Text>{weight?.weight.toFixed(3)}</Text>
    </Animated.View>
  );
};
```

---

## Battery Optimization

### Reduce Update Frequency

```typescript
const useThrottledWeight = (interval = 500) => {
  const { service } = useKGiTONScale();
  const [weight, setWeight] = useState<WeightData | null>(null);
  const lastUpdate = useRef(0);

  useEffect(() => {
    const handleWeight = (data: WeightData) => {
      const now = Date.now();
      
      if (now - lastUpdate.current >= interval) {
        setWeight(data);
        lastUpdate.current = now;
      }
    };

    service.on('weight', handleWeight);
    return () => service.off('weight', handleWeight);
  }, [service, interval]);

  return weight;
};

// Usage - Updates max once per 500ms
const Display = () => {
  const weight = useThrottledWeight(500);
  return <Text>{weight?.weight}</Text>;
};
```

### Background Connection Management

```typescript
import { AppState } from 'react-native';

const useBackgroundOptimization = () => {
  const { service, disconnect } = useKGiTONScale();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', nextAppState => {
      if (appState.current === 'active' && nextAppState.match(/inactive|background/)) {
        // App going to background
        console.log('Reducing BLE activity');
        // Option 1: Disconnect to save battery
        disconnect();
        
        // Option 2: Reduce update rate
        // service.setUpdateRate(1000); // Slower updates
      }

      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        // App coming to foreground
        console.log('Resuming normal operation');
        // Reconnect or restore update rate
      }

      appState.current = nextAppState;
    });

    return () => subscription.remove();
  }, []);
};
```

---

## Network Optimization

### Efficient API Calls

```typescript
// Batch API requests
class APIBatcher {
  private queue: Array<() => Promise<any>> = [];
  private processing = false;

  add(request: () => Promise<any>) {
    this.queue.push(request);
    this.process();
  }

  private async process() {
    if (this.processing) return;
    
    this.processing = true;

    while (this.queue.length > 0) {
      const batch = this.queue.splice(0, 5); // Process 5 at a time
      
      try {
        await Promise.all(batch.map(req => req()));
      } catch (error) {
        console.error('Batch request failed:', error);
      }

      // Wait before next batch
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    this.processing = false;
  }
}

const batcher = new APIBatcher();

// Usage
batcher.add(() => api.syncWeight(weight1));
batcher.add(() => api.syncWeight(weight2));
batcher.add(() => api.syncWeight(weight3));
```

---

## Profiling and Monitoring

### Performance Metrics

```typescript
class PerformanceMonitor {
  private metrics = {
    scanTime: [] as number[],
    connectionTime: [] as number[],
    weightLatency: [] as number[],
    renderTime: [] as number[]
  };

  startScan() {
    return Date.now();
  }

  endScan(startTime: number) {
    const duration = Date.now() - startTime;
    this.metrics.scanTime.push(duration);
    console.log(`Scan completed in ${duration}ms`);
  }

  startConnection() {
    return Date.now();
  }

  endConnection(startTime: number) {
    const duration = Date.now() - startTime;
    this.metrics.connectionTime.push(duration);
    console.log(`Connection established in ${duration}ms`);
  }

  recordWeightLatency(sentTime: number) {
    const latency = Date.now() - sentTime;
    this.metrics.weightLatency.push(latency);
  }

  getAverages() {
    return {
      avgScanTime: this.average(this.metrics.scanTime),
      avgConnectionTime: this.average(this.metrics.connectionTime),
      avgWeightLatency: this.average(this.metrics.weightLatency)
    };
  }

  private average(arr: number[]): number {
    if (arr.length === 0) return 0;
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }
}

// Usage
const monitor = new PerformanceMonitor();

const handleScan = async () => {
  const start = monitor.startScan();
  await service.scanForDevices(15000);
  monitor.endScan(start);
};

const handleConnect = async () => {
  const start = monitor.startConnection();
  await service.connectToDevice(deviceId);
  monitor.endConnection(start);
};
```

### React DevTools Integration

```typescript
// Add display names for better debugging
useKGiTONScale.displayName = 'useKGiTONScale';
useDeviceScan.displayName = 'useDeviceScan';
useWeight.displayName = 'useWeight';

// Use React.memo with display name
const WeightDisplay = memo(() => {
  // Component code
}, (prev, next) => {
  // Comparison logic
});
WeightDisplay.displayName = 'WeightDisplay';
```

---

## Best Practices Summary

### DO ✅

```typescript
// Use single service instance
const { service } = useKGiTONScale();

// Clean up event listeners
useEffect(() => {
  service.on('weight', handleWeight);
  return () => service.off('weight', handleWeight);
}, []);

// Memo expensive computations
const processedWeight = useMemo(() => {
  return weight ? calculateAverage(weight) : 0;
}, [weight]);

// Use FlatList for long lists
<FlatList
  data={devices}
  renderItem={renderDevice}
  keyExtractor={item => item.id}
/>

// Debounce/throttle rapid updates
const debouncedHandle = useMemo(
  () => debounce(handleUpdate, 200),
  []
);

// Dispose properly
useEffect(() => {
  return () => service.dispose();
}, []);
```

### DON'T ❌

```typescript
// Don't create multiple service instances
const service = new KGiTONScaleService(); // In component

// Don't forget cleanup
useEffect(() => {
  service.on('weight', handleWeight);
  // Missing cleanup!
}, []);

// Don't render all items
devices.map(device => <DeviceItem device={device} />)

// Don't scan continuously
service.scanForDevices(0); // Never stops!

// Don't update on every weight change without filtering
service.on('weight', data => {
  setState(data); // Too frequent
});
```

---

## Performance Checklist

- [ ] Single service instance across app
- [ ] Proper cleanup of event listeners
- [ ] Use memo for expensive computations
- [ ] FlatList for device lists
- [ ] Debounce/throttle rapid updates
- [ ] Filter invalid weight data
- [ ] Stop scan when device found
- [ ] Disconnect when app backgrounds
- [ ] Cache frequently accessed data
- [ ] Monitor performance metrics
- [ ] Profile with React DevTools
- [ ] Test on low-end devices

---

## See Also

- [Connection Stability](./12-connection-stability.md)
- [Testing Guide](./14-testing.md)
- [Troubleshooting](./19-troubleshooting.md)
