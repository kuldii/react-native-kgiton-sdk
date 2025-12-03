/**
 * KGiTON Scale Example App - Using React Hooks
 * 
 * This example demonstrates how to use the SDK with React hooks
 * for a more declarative and cleaner approach
 */

import React, { useState } from 'react';
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
  useKGiTONScale,
  useDeviceScan,
  useDeviceConnection,
  useBuzzer,
  useWeight,
  ScaleDevice,
  ScaleConnectionState,
} from '../src';

// ⚠️ SECURITY WARNING: Never commit real license keys to version control!
// Use environment variables or secure config for production apps.
// This is just an example placeholder - replace with your actual license key.
const LICENSE_KEY = 'YOUR-LICENSE-KEY-HERE';

const App = () => {
  // Use the main hook to get scale service and state
  const {
    service,
    weight,
    devices,
    connectionState,
    isConnected,
    isAuthenticated,
    error,
  } = useKGiTONScale(true);

  // Use specialized hooks for specific features
  const { scan, stopScan, isScanning } = useDeviceScan(service, 15000);
  const { connect, disconnect, isConnecting } = useDeviceConnection(service);
  const { beep, buzz, longBeep, turnOff } = useBuzzer(service);
  const { display, average, history } = useWeight(weight);

  const [permissionsGranted, setPermissionsGranted] = useState(false);

  React.useEffect(() => {
    requestPermissions();
  }, []);

  React.useEffect(() => {
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
    await scan();
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const response = await connect(deviceId, LICENSE_KEY);
      Alert.alert('Connection', response.message);
    } catch (err: any) {
      Alert.alert('Connection Error', err.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      Alert.alert('Disconnected', 'Device disconnected successfully');
    } catch (err: any) {
      Alert.alert('Disconnect Error', err.message);
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>KGiTON Scale</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor() }]}>
          <Text style={styles.statusText}>
            {connectionState.toUpperCase()}
          </Text>
        </View>
      </View>

      {/* Weight Display */}
      {isAuthenticated && (
        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>Current Weight</Text>
          <Text style={styles.weightValue}>{display || '---.--- kg'}</Text>
          <Text style={styles.weightTime}>
            {weight ? new Date(weight.timestamp).toLocaleTimeString() : ''}
          </Text>

          {/* Statistics */}
          {average !== null && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>{average.toFixed(3)} kg</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Samples</Text>
                <Text style={styles.statValue}>{history.length}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!isConnected ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                (isScanning || isConnecting) && styles.secondaryButton,
              ]}
              onPress={isScanning ? stopScan : handleScan}
              disabled={isConnecting}>
              <Text style={styles.buttonText}>
                {isScanning ? 'Stop Scan' : 'Scan Devices'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.primaryButton, styles.dangerButton]}
                onPress={handleDisconnect}>
                <Text style={styles.buttonText}>Disconnect</Text>
              </TouchableOpacity>
            </View>

            {isAuthenticated && (
              <View style={styles.buzzerControls}>
                <Text style={styles.sectionTitle}>Buzzer Controls</Text>
                <View style={styles.buttonGrid}>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#4CAF50' }]}
                    onPress={beep}>
                    <Text style={styles.buttonText}>Beep</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#2196F3' }]}
                    onPress={buzz}>
                    <Text style={styles.buttonText}>Buzz</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#FF9800' }]}
                    onPress={longBeep}>
                    <Text style={styles.buttonText}>Long</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#757575' }]}
                    onPress={turnOff}>
                    <Text style={styles.buttonText}>Off</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Device List */}
      {!isConnected && devices.length > 0 && (
        <View style={styles.deviceList}>
          <Text style={styles.sectionTitle}>
            Found Devices ({devices.length})
          </Text>
          {devices.map((item: ScaleDevice) => (
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
                onPress={() => handleConnect(item.id)}
                disabled={isConnecting}>
                <Text style={styles.smallButtonText}>
                  {isConnecting ? 'Connecting...' : 'Connect'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Weight History */}
      {isAuthenticated && history.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent Measurements</Text>
          {history
            .slice(-5)
            .reverse()
            .map((w, index) => (
              <View key={index} style={styles.historyItem}>
                <Text style={styles.historyWeight}>
                  {w.weight.toFixed(3)} kg
                </Text>
                <Text style={styles.historyTime}>
                  {new Date(w.timestamp).toLocaleTimeString()}
                </Text>
              </View>
            ))}
        </View>
      )}

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

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
  stats: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#757575',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  controls: {
    marginBottom: 16,
  },
  buttonRow: {
    marginBottom: 12,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
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
  historyCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  historyWeight: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  historyTime: {
    fontSize: 14,
    color: '#757575',
  },
});

export default App;
