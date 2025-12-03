/**
 * KGiTON Scale Example App - Using Context Provider
 * 
 * This example demonstrates how to use the SDK with React Context
 * for global state management across multiple components
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  PermissionsAndroid,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

// For standalone example, use relative import
// In your app, use: import { ... } from '@kgiton/react-native-sdk';
import {
  ScaleProvider,
  useScaleContext,
  ScaleDevice,
  ScaleConnectionState,
} from '../src';

// ⚠️ SECURITY WARNING: Never commit real license keys to version control!
// Use environment variables or secure config for production apps.
// This is just an example placeholder - replace with your actual license key.
const LICENSE_KEY = 'YOUR-LICENSE-KEY-HERE';

// Main app wrapped with ScaleProvider
const App = () => {
  return (
    <ScaleProvider enableLogging={true}>
      <ScaleScreen />
    </ScaleProvider>
  );
};

// Screen component that uses the scale context
const ScaleScreen = () => {
  const {
    service,
    weight,
    devices,
    connectionState,
    isConnected,
    isAuthenticated,
    error,
  } = useScaleContext();

  const [scanning, setScanning] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  useEffect(() => {
    if (error) {
      Alert.alert('Error', error.message);
    }
  }, [error]);

  const requestPermissions = async () => {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      ]);

      const allGranted = Object.values(granted).every(
        (result) => result === PermissionsAndroid.RESULTS.GRANTED
      );

      setPermissionsGranted(allGranted);

      if (!allGranted) {
        Alert.alert('Permissions', 'Bluetooth permissions are required');
      }
    } else {
      setPermissionsGranted(true);
    }
  };

  const handleScan = async () => {
    if (!permissionsGranted) {
      Alert.alert('Permissions', 'Please grant Bluetooth permissions first');
      return;
    }

    try {
      const isEnabled = await service.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert('Bluetooth', 'Please enable Bluetooth');
        return;
      }

      setScanning(true);
      await service.scanForDevices(15000);
    } catch (err: any) {
      Alert.alert('Scan Error', err.message);
    } finally {
      setScanning(false);
    }
  };

  const handleStopScan = () => {
    service.stopScan();
    setScanning(false);
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const response = await service.connectWithLicenseKey(deviceId, LICENSE_KEY);
      Alert.alert('Connection', response.message);
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await service.disconnect();
      Alert.alert('Disconnected', 'Device disconnected successfully');
    } catch (err: any) {
      Alert.alert('Disconnect Error', err.message);
    }
  };

  const handleBuzzer = async (command: string) => {
    try {
      await service.triggerBuzzer(command);
    } catch (err: any) {
      Alert.alert('Buzzer Error', err.message);
    }
  };

  const getStateColor = () => {
    switch (connectionState) {
      case ScaleConnectionState.AUTHENTICATED:
        return '#4CAF50';
      case ScaleConnectionState.CONNECTED:
        return '#2196F3';
      case ScaleConnectionState.CONNECTING:
        return '#FF9800';
      case ScaleConnectionState.SCANNING:
        return '#9C27B0';
      case ScaleConnectionState.ERROR:
        return '#F44336';
      default:
        return '#757575';
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header Component */}
      <HeaderComponent state={connectionState} getStateColor={getStateColor} />

      {/* Weight Display Component */}
      {isAuthenticated && <WeightDisplayComponent weight={weight} />}

      {/* Controls Component */}
      <ControlsComponent
        isConnected={isConnected}
        isAuthenticated={isAuthenticated}
        scanning={scanning}
        onScan={handleScan}
        onStopScan={handleStopScan}
        onDisconnect={handleDisconnect}
        onBuzzer={handleBuzzer}
      />

      {/* Device List Component */}
      {!isConnected && devices.length > 0 && (
        <DeviceListComponent devices={devices} onConnect={handleConnect} />
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

// Header Component
const HeaderComponent: React.FC<{
  state: ScaleConnectionState;
  getStateColor: () => string;
}> = ({ state, getStateColor }) => (
  <View style={styles.header}>
    <Text style={styles.title}>KGiTON Scale</Text>
    <View style={[styles.statusBadge, { backgroundColor: getStateColor() }]}>
      <Text style={styles.statusText}>{state.toUpperCase()}</Text>
    </View>
  </View>
);

// Weight Display Component
const WeightDisplayComponent: React.FC<{ weight: any }> = ({ weight }) => (
  <View style={styles.weightCard}>
    <Text style={styles.weightLabel}>Current Weight</Text>
    <Text style={styles.weightValue}>
      {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
    </Text>
    <Text style={styles.weightTime}>
      {weight ? new Date(weight.timestamp).toLocaleTimeString() : ''}
    </Text>
  </View>
);

// Controls Component
const ControlsComponent: React.FC<{
  isConnected: boolean;
  isAuthenticated: boolean;
  scanning: boolean;
  onScan: () => void;
  onStopScan: () => void;
  onDisconnect: () => void;
  onBuzzer: (command: string) => void;
}> = ({
  isConnected,
  isAuthenticated,
  scanning,
  onScan,
  onStopScan,
  onDisconnect,
  onBuzzer,
}) => (
  <View style={styles.controls}>
    {!isConnected ? (
      <TouchableOpacity
        style={[
          styles.primaryButton,
          scanning && styles.secondaryButton,
        ]}
        onPress={scanning ? onStopScan : onScan}>
        <Text style={styles.buttonText}>
          {scanning ? 'Stop Scan' : 'Scan Devices'}
        </Text>
      </TouchableOpacity>
    ) : (
      <>
        <TouchableOpacity
          style={[styles.primaryButton, styles.dangerButton]}
          onPress={onDisconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>

        {isAuthenticated && (
          <View style={styles.buzzerControls}>
            <Text style={styles.sectionTitle}>Buzzer Controls</Text>
            <View style={styles.buttonGrid}>
              <TouchableOpacity
                style={[styles.buzzerButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => onBuzzer('BEEP')}>
                <Text style={styles.buttonText}>Beep</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buzzerButton, { backgroundColor: '#2196F3' }]}
                onPress={() => onBuzzer('BUZZ')}>
                <Text style={styles.buttonText}>Buzz</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buzzerButton, { backgroundColor: '#FF9800' }]}
                onPress={() => onBuzzer('LONG')}>
                <Text style={styles.buttonText}>Long</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.buzzerButton, { backgroundColor: '#757575' }]}
                onPress={() => onBuzzer('OFF')}>
                <Text style={styles.buttonText}>Off</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    )}
  </View>
);

// Device List Component
const DeviceListComponent: React.FC<{
  devices: ScaleDevice[];
  onConnect: (deviceId: string) => void;
}> = ({ devices, onConnect }) => (
  <View style={styles.deviceList}>
    <Text style={styles.sectionTitle}>Found Devices ({devices.length})</Text>
    {devices.map((item) => (
      <View key={item.id} style={styles.deviceItem}>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName}>{item.name}</Text>
          <Text style={styles.deviceRssi}>Signal: {item.rssi} dBm</Text>
          {item.licenseKey && (
            <Text style={styles.deviceLicense}>✓ Has saved license</Text>
          )}
        </View>
        <TouchableOpacity
          style={[styles.smallButton, { backgroundColor: '#4CAF50' }]}
          onPress={() => onConnect(item.id)}>
          <Text style={styles.smallButtonText}>Connect</Text>
        </TouchableOpacity>
      </View>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  weightCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  weightLabel: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 8,
  },
  weightValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#333',
  },
  weightTime: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
  },
  controls: {
    marginBottom: 16,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  secondaryButton: {
    backgroundColor: '#757575',
  },
  dangerButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buzzerControls: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  buzzerButton: {
    flex: 1,
    minWidth: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  deviceList: {
    marginBottom: 16,
  },
  deviceItem: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  deviceRssi: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  deviceLicense: {
    fontSize: 12,
    color: '#4CAF50',
    marginTop: 2,
  },
  smallButton: {
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  smallButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default App;
