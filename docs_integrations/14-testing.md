# Testing Guide

Comprehensive guide to testing applications that use the KGiTON SDK.

## Overview

This guide covers unit testing, integration testing, mocking strategies, and testing best practices for applications using the KGiTON BLE Scale SDK.

---

## Testing Setup

### Install Dependencies

```bash
npm install --save-dev jest @testing-library/react-native @testing-library/react-hooks
npm install --save-dev @types/jest
```

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@kgiton)/)'
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ]
};
```

### Jest Setup File

```javascript
// jest.setup.js
import '@testing-library/jest-native/extend-expect';

// Mock react-native-ble-plx
jest.mock('react-native-ble-plx', () => ({
  BleManager: jest.fn(() => ({
    startDeviceScan: jest.fn(),
    stopDeviceScan: jest.fn(),
    connectToDevice: jest.fn(),
    discoverAllServicesAndCharacteristicsForDevice: jest.fn(),
    writeCharacteristicWithResponseForDevice: jest.fn(),
    monitorCharacteristicForDevice: jest.fn(),
    cancelDeviceConnection: jest.fn(),
    destroy: jest.fn()
  })),
  State: {
    PoweredOn: 'PoweredOn',
    PoweredOff: 'PoweredOff'
  }
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}));
```

---

## Mocking the SDK

### Mock Service

```typescript
// __mocks__/KGiTONScaleService.ts
import { EventEmitter } from 'events';
import { ScaleDevice, WeightData } from '@kgiton/react-native-sdk';

export class MockKGiTONScaleService extends EventEmitter {
  private mockDevices: ScaleDevice[] = [];
  private mockWeight: WeightData | null = null;
  private isConnected = false;

  async scanForDevices(timeout: number = 15000): Promise<ScaleDevice[]> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const devices: ScaleDevice[] = [
          {
            id: 'device-1',
            name: 'KGiTON Scale 1',
            rssi: -65,
            licenseKey: null
          },
          {
            id: 'device-2',
            name: 'KGiTON Scale 2',
            rssi: -75,
            licenseKey: 'ABCDE-12345-FGHIJ-67890-KLMNO'
          }
        ];
        
        this.mockDevices = devices;
        resolve(devices);
      }, 100);
    });
  }

  async connectWithLicenseKey(
    deviceId: string,
    licenseKey: string
  ): Promise<{ success: boolean; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (licenseKey.length !== 29) {
          resolve({ success: false, message: 'Invalid license format' });
          return;
        }

        this.isConnected = true;
        this.emit('connected');
        
        // Start emitting mock weight data
        this.startMockWeightEmission();
        
        resolve({ success: true, message: 'Connected successfully' });
      }, 500);
    });
  }

  async disconnect(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        this.isConnected = false;
        this.emit('disconnected');
        resolve();
      }, 100);
    });
  }

  async triggerBuzzer(command: string): Promise<void> {
    if (!this.isConnected) {
      throw new Error('Not connected');
    }
    
    return Promise.resolve();
  }

  getLastWeight(): WeightData | null {
    return this.mockWeight;
  }

  isDeviceConnected(): boolean {
    return this.isConnected;
  }

  async dispose(): Promise<void> {
    this.removeAllListeners();
    this.isConnected = false;
    this.mockWeight = null;
  }

  // Test helpers
  private startMockWeightEmission() {
    setInterval(() => {
      if (this.isConnected) {
        const weight: WeightData = {
          weight: Math.random() * 100,
          unit: 'kg',
          timestamp: Date.now()
        };
        
        this.mockWeight = weight;
        this.emit('weight', weight);
      }
    }, 1000);
  }

  // Helper to emit events manually in tests
  emitMockWeight(weight: number) {
    const data: WeightData = {
      weight,
      unit: 'kg',
      timestamp: Date.now()
    };
    this.mockWeight = data;
    this.emit('weight', data);
  }

  emitMockError(error: Error) {
    this.emit('error', error);
  }
}
```

### Mock Hook

```typescript
// __mocks__/useKGiTONScale.ts
import { MockKGiTONScaleService } from './KGiTONScaleService';

const mockService = new MockKGiTONScaleService();

export const useKGiTONScale = jest.fn(() => ({
  service: mockService,
  devices: [],
  weight: null,
  connectionState: 'disconnected',
  connectedDevice: null,
  error: null,
  scan: jest.fn(),
  stopScan: jest.fn(),
  connect: jest.fn(),
  disconnect: jest.fn(),
  triggerBuzzer: jest.fn(),
  isScanning: false,
  isConnected: false,
  isAuthenticated: false
}));
```

---

## Unit Testing

### Testing Hooks

```typescript
// hooks/__tests__/useKGiTONScale.test.ts
import { renderHook, act } from '@testing-library/react-hooks';
import { useKGiTONScale } from '../useKGiTONScale';
import { MockKGiTONScaleService } from '../../__mocks__/KGiTONScaleService';

jest.mock('../../services/KGiTONScaleService', () => ({
  KGiTONScaleService: MockKGiTONScaleService
}));

describe('useKGiTONScale', () => {
  it('should initialize with default state', () => {
    const { result } = renderHook(() => useKGiTONScale());

    expect(result.current.devices).toEqual([]);
    expect(result.current.weight).toBeNull();
    expect(result.current.connectionState).toBe('disconnected');
    expect(result.current.isConnected).toBe(false);
  });

  it('should scan for devices', async () => {
    const { result } = renderHook(() => useKGiTONScale());

    await act(async () => {
      await result.current.scan(15000);
    });

    expect(result.current.devices.length).toBeGreaterThan(0);
  });

  it('should connect to device with license key', async () => {
    const { result } = renderHook(() => useKGiTONScale());

    await act(async () => {
      await result.current.connect(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionState).toBe('connected');
  });

  it('should disconnect from device', async () => {
    const { result } = renderHook(() => useKGiTONScale());

    // Connect first
    await act(async () => {
      await result.current.connect(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    // Then disconnect
    await act(async () => {
      await result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionState).toBe('disconnected');
  });

  it('should receive weight data after connection', async () => {
    const { result } = renderHook(() => useKGiTONScale());

    await act(async () => {
      await result.current.connect(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1100));
    });

    expect(result.current.weight).not.toBeNull();
    expect(result.current.weight?.weight).toBeGreaterThanOrEqual(0);
  });
});
```

### Testing Service

```typescript
// services/__tests__/KGiTONScaleService.test.ts
import { KGiTONScaleService } from '../KGiTONScaleService';
import { BLEConnectionException, AuthenticationException } from '../exceptions';

describe('KGiTONScaleService', () => {
  let service: KGiTONScaleService;

  beforeEach(() => {
    service = new KGiTONScaleService();
  });

  afterEach(async () => {
    await service.dispose();
  });

  describe('Device Scanning', () => {
    it('should scan for devices successfully', async () => {
      const devices = await service.scanForDevices(15000);
      expect(Array.isArray(devices)).toBe(true);
    });

    it('should find KGiTON devices only', async () => {
      const devices = await service.scanForDevices(15000);
      
      devices.forEach(device => {
        expect(device.name).toContain('KGiTON');
      });
    });

    it('should return devices with required properties', async () => {
      const devices = await service.scanForDevices(15000);
      
      if (devices.length > 0) {
        const device = devices[0];
        expect(device).toHaveProperty('id');
        expect(device).toHaveProperty('name');
        expect(device).toHaveProperty('rssi');
      }
    });
  });

  describe('Connection', () => {
    it('should connect with valid license key', async () => {
      const result = await service.connectWithLicenseKey(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );

      expect(result.success).toBe(true);
      expect(service.isDeviceConnected()).toBe(true);
    });

    it('should reject invalid license format', async () => {
      await expect(
        service.connectWithLicenseKey('device-1', 'INVALID')
      ).rejects.toThrow(AuthenticationException);
    });

    it('should emit connected event', async () => {
      const connectedSpy = jest.fn();
      service.on('connected', connectedSpy);

      await service.connectWithLicenseKey(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );

      expect(connectedSpy).toHaveBeenCalled();
    });
  });

  describe('Weight Data', () => {
    beforeEach(async () => {
      await service.connectWithLicenseKey(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    it('should receive weight data', (done) => {
      service.on('weight', (data) => {
        expect(data).toHaveProperty('weight');
        expect(data).toHaveProperty('unit');
        expect(data).toHaveProperty('timestamp');
        done();
      });
    });

    it('should validate weight data range', (done) => {
      service.on('weight', (data) => {
        expect(data.weight).toBeGreaterThanOrEqual(0);
        expect(data.weight).toBeLessThanOrEqual(500);
        done();
      });
    });
  });

  describe('Buzzer Control', () => {
    beforeEach(async () => {
      await service.connectWithLicenseKey(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    it('should trigger buzzer when connected', async () => {
      await expect(
        service.triggerBuzzer('BEEP')
      ).resolves.not.toThrow();
    });

    it('should reject invalid buzzer command', async () => {
      await expect(
        service.triggerBuzzer('INVALID_COMMAND')
      ).rejects.toThrow();
    });
  });

  describe('Disconnection', () => {
    beforeEach(async () => {
      await service.connectWithLicenseKey(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });

    it('should disconnect successfully', async () => {
      await service.disconnect();
      expect(service.isDeviceConnected()).toBe(false);
    });

    it('should emit disconnected event', async () => {
      const disconnectedSpy = jest.fn();
      service.on('disconnected', disconnectedSpy);

      await service.disconnect();

      expect(disconnectedSpy).toHaveBeenCalled();
    });
  });
});
```

---

## Component Testing

### Testing with React Testing Library

```typescript
// components/__tests__/WeightDisplay.test.tsx
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { WeightDisplay } from '../WeightDisplay';
import { useKGiTONScale } from '../../hooks/useKGiTONScale';

jest.mock('../../hooks/useKGiTONScale');

describe('WeightDisplay', () => {
  it('should render placeholder when no weight', () => {
    (useKGiTONScale as jest.Mock).mockReturnValue({
      weight: null,
      isAuthenticated: false
    });

    const { getByText } = render(<WeightDisplay />);
    
    expect(getByText('---.--- kg')).toBeTruthy();
  });

  it('should display weight when authenticated', () => {
    (useKGiTONScale as jest.Mock).mockReturnValue({
      weight: { weight: 12.345, unit: 'kg', timestamp: Date.now() },
      isAuthenticated: true
    });

    const { getByText } = render(<WeightDisplay />);
    
    expect(getByText('12.345 kg')).toBeTruthy();
  });

  it('should show not connected message', () => {
    (useKGiTONScale as jest.Mock).mockReturnValue({
      weight: null,
      isAuthenticated: false
    });

    const { getByText } = render(<WeightDisplay />);
    
    expect(getByText('Not connected')).toBeTruthy();
  });
});
```

### Testing User Interactions

```typescript
// components/__tests__/DeviceList.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { DeviceList } from '../DeviceList';

const mockDevices = [
  { id: 'device-1', name: 'Scale 1', rssi: -65, licenseKey: null },
  { id: 'device-2', name: 'Scale 2', rssi: -75, licenseKey: null }
];

describe('DeviceList', () => {
  it('should render device list', () => {
    const { getByText } = render(
      <DeviceList devices={mockDevices} onConnect={jest.fn()} />
    );

    expect(getByText('Scale 1')).toBeTruthy();
    expect(getByText('Scale 2')).toBeTruthy();
  });

  it('should call onConnect when device pressed', async () => {
    const onConnect = jest.fn();
    
    const { getByText, getByPlaceholderText } = render(
      <DeviceList devices={mockDevices} onConnect={onConnect} />
    );

    // Press device
    fireEvent.press(getByText('Scale 1'));

    // Enter license key
    const input = getByPlaceholderText('XXXXX-XXXXX-XXXXX-XXXXX-XXXXX');
    fireEvent.changeText(input, 'ABCDE-12345-FGHIJ-67890-KLMNO');

    // Press connect
    fireEvent.press(getByText('Connect'));

    await waitFor(() => {
      expect(onConnect).toHaveBeenCalledWith(
        'device-1',
        'ABCDE-12345-FGHIJ-67890-KLMNO'
      );
    });
  });

  it('should display empty state when no devices', () => {
    const { getByText } = render(
      <DeviceList devices={[]} onConnect={jest.fn()} />
    );

    expect(getByText('No devices found')).toBeTruthy();
  });
});
```

---

## Integration Testing

### End-to-End Flow

```typescript
// __tests__/integration/ScaleWorkflow.test.tsx
import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { ScaleProvider } from '../../context/ScaleContext';
import App from '../../App';

describe('Scale Workflow Integration', () => {
  it('should complete full scale workflow', async () => {
    const { getByText, getByPlaceholderText } = render(
      <ScaleProvider>
        <App />
      </ScaleProvider>
    );

    // Step 1: Start scan
    const scanButton = getByText('Scan for Devices');
    fireEvent.press(scanButton);

    // Step 2: Wait for devices
    await waitFor(() => {
      expect(getByText(/Scale/)).toBeTruthy();
    }, { timeout: 5000 });

    // Step 3: Select device
    const device = getByText('KGiTON Scale 1');
    fireEvent.press(device);

    // Step 4: Enter license
    const licenseInput = getByPlaceholderText('Enter License Key');
    fireEvent.changeText(licenseInput, 'ABCDE-12345-FGHIJ-67890-KLMNO');

    // Step 5: Connect
    const connectButton = getByText('Connect');
    fireEvent.press(connectButton);

    // Step 6: Wait for connection
    await waitFor(() => {
      expect(getByText('Connected')).toBeTruthy();
    }, { timeout: 5000 });

    // Step 7: Wait for weight data
    await waitFor(() => {
      expect(getByText(/kg/)).toBeTruthy();
    }, { timeout: 3000 });

    // Step 8: Trigger buzzer
    const buzzerButton = getByText('Beep');
    fireEvent.press(buzzerButton);

    // Step 9: Disconnect
    const disconnectButton = getByText('Disconnect');
    fireEvent.press(disconnectButton);

    await waitFor(() => {
      expect(getByText('Disconnected')).toBeTruthy();
    });
  });
});
```

---

## Snapshot Testing

```typescript
// components/__tests__/WeightCard.snapshot.test.tsx
import React from 'react';
import renderer from 'react-test-renderer';
import { WeightCard } from '../WeightCard';

describe('WeightCard Snapshots', () => {
  it('should match snapshot with no weight', () => {
    const tree = renderer
      .create(<WeightCard weight={null} />)
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });

  it('should match snapshot with weight data', () => {
    const weight = {
      weight: 12.345,
      unit: 'kg',
      timestamp: 1234567890
    };

    const tree = renderer
      .create(<WeightCard weight={weight} />)
      .toJSON();
    
    expect(tree).toMatchSnapshot();
  });
});
```

---

## Testing Error Handling

```typescript
// __tests__/ErrorHandling.test.ts
import { KGiTONScaleService } from '../services/KGiTONScaleService';
import {
  BLEConnectionException,
  AuthenticationException,
  DeviceNotFoundException
} from '../exceptions';

describe('Error Handling', () => {
  let service: KGiTONScaleService;

  beforeEach(() => {
    service = new KGiTONScaleService();
  });

  it('should throw BLEConnectionException on connection failure', async () => {
    await expect(
      service.connectToDevice('non-existent-device')
    ).rejects.toThrow(BLEConnectionException);
  });

  it('should throw AuthenticationException on invalid license', async () => {
    await expect(
      service.connectWithLicenseKey('device-1', 'INVALID')
    ).rejects.toThrow(AuthenticationException);
  });

  it('should throw DeviceNotFoundException when device not found', async () => {
    await expect(
      service.connectToDevice('unknown-device')
    ).rejects.toThrow(DeviceNotFoundException);
  });

  it('should handle error event', (done) => {
    service.on('error', (error) => {
      expect(error).toBeInstanceOf(Error);
      done();
    });

    service.emit('error', new Error('Test error'));
  });
});
```

---

## Performance Testing

```typescript
// __tests__/Performance.test.ts
import { KGiTONScaleService } from '../services/KGiTONScaleService';

describe('Performance Tests', () => {
  let service: KGiTONScaleService;

  beforeEach(() => {
    service = new KGiTONScaleService();
  });

  it('should scan devices within timeout', async () => {
    const start = Date.now();
    await service.scanForDevices(15000);
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(16000); // With margin
  });

  it('should connect within reasonable time', async () => {
    const start = Date.now();
    
    await service.connectWithLicenseKey(
      'device-1',
      'ABCDE-12345-FGHIJ-67890-KLMNO'
    );
    
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(5000); // 5 seconds
  });

  it('should handle multiple rapid weight updates', async () => {
    await service.connectWithLicenseKey(
      'device-1',
      'ABCDE-12345-FGHIJ-67890-KLMNO'
    );

    const weights: number[] = [];
    
    service.on('weight', (data) => {
      weights.push(data.weight);
    });

    await new Promise(resolve => setTimeout(resolve, 5000));

    expect(weights.length).toBeGreaterThan(0);
  });
});
```

---

## Test Coverage

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Coverage Configuration

```javascript
// jest.config.js
module.exports = {
  // ... other config
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/__tests__/**'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

---

## Best Practices

### 1. Test Isolation

```typescript
// Each test should be independent
describe('Service Tests', () => {
  let service: KGiTONScaleService;

  beforeEach(() => {
    service = new KGiTONScaleService(); // Fresh instance
  });

  afterEach(async () => {
    await service.dispose(); // Cleanup
  });

  it('test 1', async () => {
    // Test logic
  });

  it('test 2', async () => {
    // Independent test logic
  });
});
```

### 2. Mock External Dependencies

```typescript
// Mock BLE manager
jest.mock('react-native-ble-plx');

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage');
```

### 3. Test Edge Cases

```typescript
it('should handle empty device list', async () => {
  const devices = await service.scanForDevices(100);
  expect(Array.isArray(devices)).toBe(true);
});

it('should handle invalid weight values', () => {
  const invalidWeights = [-1, 1000, NaN, Infinity];
  
  invalidWeights.forEach(weight => {
    expect(() => validateWeight(weight)).toThrow();
  });
});
```

### 4. Use Descriptive Test Names

```typescript
// ✅ GOOD
it('should throw AuthenticationException when license format is invalid', async () => {
  // ...
});

// ❌ BAD
it('test auth', async () => {
  // ...
});
```

---

## See Also

- [Error Handling](./11-error-handling.md)
- [Performance Guide](./13-performance.md)
- [Troubleshooting](./19-troubleshooting.md)
