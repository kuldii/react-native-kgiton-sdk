# Context API Reference

Complete reference for the React Context API provided by the KGiTON SDK.

## Overview

The Context API provides a way to share the KGiTON scale service across your entire application without prop drilling. It includes a provider component, context hook, and HOC for easy integration.

## Installation

Context API is included in the main SDK package:

```typescript
import { ScaleProvider, useScaleContext, withScale } from '@kgiton/react-native-sdk';
```

---

## ScaleProvider

The provider component that wraps your application and provides scale functionality to all child components.

### Usage

```typescript
import React from 'react';
import { ScaleProvider } from '@kgiton/react-native-sdk';
import App from './App';

const Root = () => {
  return (
    <ScaleProvider enableLogging={true}>
      <App />
    </ScaleProvider>
  );
};

export default Root;
```

### Props

```typescript
interface ScaleProviderProps {
  children: React.ReactNode;
  enableLogging?: boolean;
  autoDispose?: boolean;
}
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | - | Child components (required) |
| `enableLogging` | `boolean` | `false` | Enable SDK logging |
| `autoDispose` | `boolean` | `true` | Auto cleanup on unmount |

### Example with Configuration

```typescript
<ScaleProvider 
  enableLogging={__DEV__}  // Enable in development only
  autoDispose={true}
>
  <NavigationContainer>
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Scale" component={ScaleScreen} />
    </Stack.Navigator>
  </NavigationContainer>
</ScaleProvider>
```

---

## useScaleContext

Hook to access the scale context in any child component.

### Signature

```typescript
function useScaleContext(): ScaleContextValue
```

### Return Value

```typescript
interface ScaleContextValue {
  // Service instance
  service: KGiTONScaleService;
  
  // State
  devices: ScaleDevice[];
  weight: WeightData | null;
  connectionState: ScaleConnectionState;
  connectedDevice: ScaleDevice | null;
  error: Error | null;
  
  // Actions
  scan: (timeout?: number) => Promise<void>;
  stopScan: () => void;
  connect: (deviceId: string, licenseKey: string) => Promise<ControlResponse>;
  disconnect: () => Promise<void>;
  disconnectWithKey: (licenseKey: string) => Promise<ControlResponse>;
  triggerBuzzer: (command: string) => Promise<void>;
  
  // Status
  isScanning: boolean;
  isConnected: boolean;
  isAuthenticated: boolean;
}
```

### Example

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useScaleContext } from '@kgiton/react-native-sdk';

const WeightDisplay = () => {
  const { weight, isAuthenticated, triggerBuzzer } = useScaleContext();

  if (!isAuthenticated) {
    return <Text>Not connected</Text>;
  }

  return (
    <View>
      <Text style={{ fontSize: 48 }}>
        {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
      </Text>
      <Button 
        title="Beep" 
        onPress={() => triggerBuzzer('BEEP')} 
      />
    </View>
  );
};

export default WeightDisplay;
```

### Usage in Multiple Components

```typescript
// DeviceScanner.tsx
import { useScaleContext } from '@kgiton/react-native-sdk';

const DeviceScanner = () => {
  const { devices, scan, isScanning } = useScaleContext();
  
  return (
    <View>
      <Button
        title={isScanning ? 'Scanning...' : 'Scan'}
        onPress={() => scan(15000)}
      />
      {/* Device list */}
    </View>
  );
};

// ConnectionManager.tsx
import { useScaleContext } from '@kgiton/react-native-sdk';

const ConnectionManager = () => {
  const { connect, disconnect, isConnected } = useScaleContext();
  
  return (
    <View>
      {isConnected ? (
        <Button title="Disconnect" onPress={disconnect} />
      ) : (
        <Button title="Connect" onPress={() => connect(deviceId, key)} />
      )}
    </View>
  );
};

// WeightMonitor.tsx
import { useScaleContext } from '@kgiton/react-native-sdk';

const WeightMonitor = () => {
  const { weight } = useScaleContext();
  
  return (
    <Text>{weight?.weight.toFixed(3)} kg</Text>
  );
};
```

---

## withScale (HOC)

Higher-Order Component that injects scale context as props.

### Signature

```typescript
function withScale<P>(
  Component: React.ComponentType<P & ScaleContextValue>
): React.ComponentType<P>
```

### Example

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { 
  withScale, 
  ScaleContextValue,
  WeightData 
} from '@kgiton/react-native-sdk';

interface Props {
  title: string;
}

// Component receives scale context as props
const WeightDisplayClass = ({ 
  title, 
  weight, 
  isAuthenticated, 
  triggerBuzzer 
}: Props & ScaleContextValue) => {
  return (
    <View>
      <Text>{title}</Text>
      {isAuthenticated && weight && (
        <>
          <Text>{weight.weight.toFixed(3)} kg</Text>
          <Button 
            title="Beep" 
            onPress={() => triggerBuzzer('BEEP')} 
          />
        </>
      )}
    </View>
  );
};

// Wrap with HOC
export default withScale(WeightDisplayClass);

// Usage
<WeightDisplayClass title="Current Weight" />
```

### Class Component Example

```typescript
import React, { Component } from 'react';
import { View, Text, Button } from 'react-native';
import { withScale, ScaleContextValue } from '@kgiton/react-native-sdk';

interface Props {
  // Your props
}

type AllProps = Props & ScaleContextValue;

class ScaleManager extends Component<AllProps> {
  async componentDidMount() {
    // Access scale context via props
    const { scan } = this.props;
    await scan(15000);
  }

  handleConnect = async () => {
    const { connect } = this.props;
    try {
      await connect('DEVICE_ID', 'LICENSE_KEY');
    } catch (error) {
      console.error(error);
    }
  };

  render() {
    const { weight, isAuthenticated } = this.props;
    
    return (
      <View>
        {isAuthenticated && weight && (
          <Text>{weight.weight} kg</Text>
        )}
        <Button title="Connect" onPress={this.handleConnect} />
      </View>
    );
  }
}

export default withScale(ScaleManager);
```

---

## Complete Application Example

### App Structure

```
src/
├── App.tsx                 # Root with ScaleProvider
├── screens/
│   ├── HomeScreen.tsx      # Landing page
│   ├── ScanScreen.tsx      # Device scanning
│   ├── ScaleScreen.tsx     # Weight display
│   └── SettingsScreen.tsx  # Settings
└── components/
    ├── DeviceList.tsx      # Device list component
    ├── WeightCard.tsx      # Weight display card
    └── ConnectionStatus.tsx # Status indicator
```

### Root App Component

```typescript
// App.tsx
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { ScaleProvider } from '@kgiton/react-native-sdk';

import HomeScreen from './screens/HomeScreen';
import ScanScreen from './screens/ScanScreen';
import ScaleScreen from './screens/ScaleScreen';

const Stack = createStackNavigator();

const App = () => {
  return (
    <ScaleProvider enableLogging={__DEV__}>
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home" component={HomeScreen} />
          <Stack.Screen name="Scan" component={ScanScreen} />
          <Stack.Screen name="Scale" component={ScaleScreen} />
        </Stack.Navigator>
      </NavigationContainer>
    </ScaleProvider>
  );
};

export default App;
```

### Scan Screen

```typescript
// screens/ScanScreen.tsx
import React, { useEffect } from 'react';
import { View, Button, FlatList, StyleSheet } from 'react-native';
import { useScaleContext } from '@kgiton/react-native-sdk';
import DeviceList from '../components/DeviceList';

const ScanScreen = ({ navigation }) => {
  const {
    devices,
    isScanning,
    scan,
    stopScan,
    connect
  } = useScaleContext();

  useEffect(() => {
    // Auto-scan on mount
    scan(15000);
    
    return () => {
      stopScan();
    };
  }, []);

  const handleConnect = async (deviceId: string, licenseKey: string) => {
    try {
      await connect(deviceId, licenseKey);
      navigation.navigate('Scale');
    } catch (error: any) {
      console.error(error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Button
        title={isScanning ? 'Stop Scan' : 'Scan Again'}
        onPress={isScanning ? stopScan : () => scan(15000)}
      />
      
      <DeviceList 
        devices={devices}
        onConnect={handleConnect}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  }
});

export default ScanScreen;
```

### Scale Screen

```typescript
// screens/ScaleScreen.tsx
import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import { useScaleContext } from '@kgiton/react-native-sdk';
import WeightCard from '../components/WeightCard';
import ConnectionStatus from '../components/ConnectionStatus';

const ScaleScreen = ({ navigation }) => {
  const {
    weight,
    connectedDevice,
    isAuthenticated,
    disconnect,
    triggerBuzzer
  } = useScaleContext();

  const handleDisconnect = async () => {
    await disconnect();
    navigation.goBack();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Text>Not authenticated</Text>
        <Button title="Go Back" onPress={() => navigation.goBack()} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ConnectionStatus device={connectedDevice} />
      
      <WeightCard weight={weight} />
      
      <View style={styles.controls}>
        <Button title="Beep" onPress={() => triggerBuzzer('BEEP')} />
        <Button title="Buzz" onPress={() => triggerBuzzer('BUZZ')} />
        <Button title="Long" onPress={() => triggerBuzzer('LONG')} />
      </View>
      
      <Button 
        title="Disconnect" 
        onPress={handleDisconnect}
        color="red"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 20
  }
});

export default ScaleScreen;
```

### Reusable Components

```typescript
// components/DeviceList.tsx
import React, { useState } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity,
  Modal,
  TextInput,
  Button,
  StyleSheet 
} from 'react-native';
import { ScaleDevice } from '@kgiton/react-native-sdk';

interface Props {
  devices: ScaleDevice[];
  onConnect: (deviceId: string, licenseKey: string) => void;
}

const DeviceList = ({ devices, onConnect }: Props) => {
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [licenseKey, setLicenseKey] = useState('');

  const handleConnect = () => {
    if (selectedDevice && licenseKey) {
      onConnect(selectedDevice, licenseKey);
      setSelectedDevice(null);
      setLicenseKey('');
    }
  };

  return (
    <>
      <FlatList
        data={devices}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.deviceItem}
            onPress={() => setSelectedDevice(item.id)}
          >
            <Text style={styles.deviceName}>{item.name}</Text>
            <Text style={styles.deviceRssi}>{item.rssi} dBm</Text>
            {item.licenseKey && (
              <Text style={styles.hasLicense}>✓ Has License</Text>
            )}
          </TouchableOpacity>
        )}
      />
      
      <Modal visible={!!selectedDevice} transparent animationType="fade">
        <View style={styles.modal}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Enter License Key</Text>
            <TextInput
              style={styles.input}
              value={licenseKey}
              onChangeText={setLicenseKey}
              placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
              autoCapitalize="characters"
            />
            <View style={styles.modalButtons}>
              <Button title="Cancel" onPress={() => setSelectedDevice(null)} />
              <Button title="Connect" onPress={handleConnect} />
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  deviceItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  deviceRssi: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  hasLicense: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 4
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 20
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 4,
    padding: 12,
    marginBottom: 16,
    fontFamily: 'monospace'
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around'
  }
});

export default DeviceList;
```

```typescript
// components/WeightCard.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WeightData } from '@kgiton/react-native-sdk';

interface Props {
  weight: WeightData | null;
}

const WeightCard = ({ weight }: Props) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Current Weight</Text>
      <Text style={styles.weight}>
        {weight ? `${weight.weight.toFixed(3)}` : '---.-'}
      </Text>
      <Text style={styles.unit}>{weight?.unit || 'kg'}</Text>
      {weight && (
        <Text style={styles.timestamp}>
          {new Date(weight.timestamp).toLocaleTimeString()}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginVertical: 20
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8
  },
  weight: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#333'
  },
  unit: {
    fontSize: 24,
    color: '#666',
    marginTop: 8
  },
  timestamp: {
    fontSize: 14,
    color: '#999',
    marginTop: 12
  }
});

export default WeightCard;
```

---

## Best Practices

### 1. Provider Placement

Place `ScaleProvider` at the root of your app, above navigation:

```typescript
// ✅ GOOD
<ScaleProvider>
  <NavigationContainer>
    <App />
  </NavigationContainer>
</ScaleProvider>

// ❌ BAD - Provider inside navigation
<NavigationContainer>
  <ScaleProvider>
    <App />
  </ScaleProvider>
</NavigationContainer>
```

### 2. Context Usage

Only use `useScaleContext` in components that need scale functionality:

```typescript
// ✅ GOOD - Only components that need it
const WeightDisplay = () => {
  const { weight } = useScaleContext();
  return <Text>{weight?.weight}</Text>;
};

// ❌ BAD - Unnecessary context usage
const Header = () => {
  const { weight } = useScaleContext(); // Not using weight
  return <Text>My App</Text>;
};
```

### 3. Error Boundaries

Wrap context consumers in error boundaries:

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ScaleProvider>
  <ErrorBoundary fallback={<ErrorScreen />}>
    <App />
  </ErrorBoundary>
</ScaleProvider>
```

### 4. Multiple Screens

Share state across screens seamlessly:

```typescript
// Screen A - Scan devices
const ScanScreen = () => {
  const { scan, devices } = useScaleContext();
  // Scan and navigate
};

// Screen B - Show weight (same service instance)
const WeightScreen = () => {
  const { weight, isAuthenticated } = useScaleContext();
  // Display weight from same connection
};
```

---

## Typescript Support

Full TypeScript support with type inference:

```typescript
import { useScaleContext, ScaleContextValue } from '@kgiton/react-native-sdk';

// Type is automatically inferred
const { weight, connect } = useScaleContext();

// Or explicitly type
const context: ScaleContextValue = useScaleContext();
```

---

## See Also

- [Hooks API Reference](./09-api-hooks.md)
- [Context Integration Guide](./17-context-integration.md)
- [Service API Reference](./07-api-service.md)
