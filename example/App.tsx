/**
 * KGiTON Scale Example App
 * 
 * Complete example demonstrating all features of the KGiTON React Native SDK
 */

import React, { useEffect, useState } from 'react';
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
  KGiTONScaleService,
  ScaleDevice,
  WeightData,
  ScaleConnectionState,
  ControlResponse,
} from '../src';

// ⚠️ SECURITY WARNING: Never commit real license keys to version control!
// Use environment variables or secure config for production apps.
// This is just an example placeholder - replace with your actual license key.
const LICENSE_KEY = 'YOUR-LICENSE-KEY-HERE';

const App = () => {
  const [service] = useState(() => new KGiTONScaleService(true));
  const [devices, setDevices] = useState<ScaleDevice[]>([]);
  const [weight, setWeight] = useState<WeightData | null>(null);
  const [state, setState] = useState<ScaleConnectionState>(
    ScaleConnectionState.DISCONNECTED
  );
  const [scanning, setScanning] = useState(false);
  const [weightHistory, setWeightHistory] = useState<WeightData[]>([]);

  useEffect(() => {
    // Request permissions on mount
    requestPermissions();

    // Setup event handlers
    service.setEventHandlers({
      onWeightData: (data) => {
        setWeight(data);
        setWeightHistory((prev) => [...prev.slice(-9), data]);
      },
      onConnectionStateChange: (newState) => {
        setState(newState);
        if (newState === ScaleConnectionState.SCANNING) {
          setScanning(true);
        } else {
          setScanning(false);
        }
      },
      onDevicesFound: (foundDevices) => {
        setDevices(foundDevices);
      },
      onError: (error) => {
        Alert.alert('Error', error.message);
      },
    });

    // Cleanup on unmount
    return () => {
      service.dispose();
    };
  }, []);

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

      if (!allGranted) {
        Alert.alert('Permissions', 'Bluetooth permissions are required');
      }
    }
  };

  const handleScan = async () => {
    try {
      const isEnabled = await service.isBluetoothEnabled();
      if (!isEnabled) {
        Alert.alert('Bluetooth', 'Please enable Bluetooth');
        return;
      }

      await service.scanForDevices(15000); // 15 seconds
    } catch (error: any) {
      Alert.alert('Scan Error', error.message);
    }
  };

  const handleStopScan = () => {
    service.stopScan();
  };

  const handleConnect = async (deviceId: string) => {
    try {
      const response: ControlResponse = await service.connectWithLicenseKey(
        deviceId,
        LICENSE_KEY
      );
      Alert.alert('Connection', response.message);
    } catch (error: any) {
      Alert.alert('Connection Error', error.message);
    }
  };

  const handleDisconnect = async () => {
    try {
      await service.disconnect();
      Alert.alert('Disconnected', 'Device disconnected successfully');
      setWeightHistory([]);
    } catch (error: any) {
      Alert.alert('Disconnect Error', error.message);
    }
  };

  const handleBuzzer = async (command: string) => {
    try {
      await service.triggerBuzzer(command);
    } catch (error: any) {
      Alert.alert('Buzzer Error', error.message);
    }
  };

  const getStateColor = () => {
    switch (state) {
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

  const calculateAverage = () => {
    if (weightHistory.length === 0) return 0;
    const sum = weightHistory.reduce((acc, w) => acc + w.weight, 0);
    return sum / weightHistory.length;
  };

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>KGiTON Scale</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStateColor() }]}>
          <Text style={styles.statusText}>{state.toUpperCase()}</Text>
        </View>
      </View>

      {/* Weight Display */}
      {service.isAuthenticated() && (
        <View style={styles.weightCard}>
          <Text style={styles.weightLabel}>Current Weight</Text>
          <Text style={styles.weightValue}>
            {weight ? `${weight.weight.toFixed(3)} kg` : '---.--- kg'}
          </Text>
          <Text style={styles.weightTime}>
            {weight ? new Date(weight.timestamp).toLocaleTimeString() : ''}
          </Text>

          {/* Statistics */}
          {weightHistory.length > 0 && (
            <View style={styles.stats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Average</Text>
                <Text style={styles.statValue}>
                  {calculateAverage().toFixed(3)} kg
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Samples</Text>
                <Text style={styles.statValue}>{weightHistory.length}</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {/* Connected Device Info */}
      {service.isConnected() && (
        <View style={styles.deviceInfoCard}>
          <Text style={styles.sectionTitle}>Connected Device</Text>
          {service.getConnectedDevice() && (
            <>
              <Text style={styles.deviceInfoText}>
                Name: {service.getConnectedDevice()?.name}
              </Text>
              <Text style={styles.deviceInfoText}>
                ID: {service.getConnectedDevice()?.id}
              </Text>
              <Text style={styles.deviceInfoText}>
                RSSI: {service.getConnectedDevice()?.rssi} dBm
              </Text>
            </>
          )}
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controls}>
        {!service.isConnected() ? (
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[
                styles.primaryButton,
                scanning && styles.secondaryButton,
              ]}
              onPress={scanning ? handleStopScan : handleScan}>
              <Text style={styles.buttonText}>
                {scanning ? 'Stop Scan' : 'Scan Devices'}
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
            {service.isAuthenticated() && (
              <View style={styles.buzzerControls}>
                <Text style={styles.sectionTitle}>Buzzer Controls</Text>
                <View style={styles.buttonGrid}>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#4CAF50' }]}
                    onPress={() => handleBuzzer('BEEP')}>
                    <Text style={styles.buttonText}>Beep</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#2196F3' }]}
                    onPress={() => handleBuzzer('BUZZ')}>
                    <Text style={styles.buttonText}>Buzz</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#FF9800' }]}
                    onPress={() => handleBuzzer('LONG')}>
                    <Text style={styles.buttonText}>Long</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.buzzerButton, { backgroundColor: '#757575' }]}
                    onPress={() => handleBuzzer('OFF')}>
                    <Text style={styles.buttonText}>Off</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>

      {/* Device List */}
      {!service.isConnected() && devices.length > 0 && (
        <View style={styles.deviceList}>
          <Text style={styles.sectionTitle}>
            Found Devices ({devices.length})
          </Text>
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
                onPress={() => handleConnect(item.id)}>
                <Text style={styles.smallButtonText}>Connect</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Weight History */}
      {service.isAuthenticated() && weightHistory.length > 0 && (
        <View style={styles.historyCard}>
          <Text style={styles.sectionTitle}>Recent Measurements</Text>
          {weightHistory.slice(-5).reverse().map((w, index) => (
            <View key={index} style={styles.historyItem}>
              <Text style={styles.historyWeight}>{w.weight.toFixed(3)} kg</Text>
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
  deviceInfoCard: {
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
  deviceInfoText: {
    fontSize: 14,
    color: '#555',
    marginTop: 4,
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
