# KGiTON React Native SDK - Project Structure

## 📁 Directory Structure

```
react_native/
├── src/                          # Source code
│   ├── KGiTONScaleService.ts    # Main service class
│   ├── index.ts                 # Public API exports
│   ├── hooks.ts                 # React hooks (optional)
│   ├── context.tsx              # React Context API (optional)
│   ├── models/                  # Data models
│   │   ├── ScaleConnectionState.ts
│   │   ├── ScaleDevice.ts
│   │   ├── WeightData.ts
│   │   ├── ControlResponse.ts
│   │   └── index.ts
│   ├── constants/               # Constants
│   │   ├── BLEConstants.ts
│   │   └── index.ts
│   ├── exceptions/              # Custom exceptions
│   │   ├── KGiTONExceptions.ts
│   │   └── index.ts
│   └── utils/                   # Utility functions
│       ├── DataValidation.ts
│       ├── RetryPolicy.ts
│       ├── ConnectionStability.ts
│       └── index.ts
├── docs/                        # Documentation
│   ├── INTEGRATION.md           # Integration guide
│   └── TROUBLESHOOTING.md       # Troubleshooting guide
├── example/                     # Example application
│   └── README.md                # Example code and guide
├── lib/                         # Compiled output (generated)
├── package.json                 # NPM package config
├── tsconfig.json                # TypeScript config
├── README.md                    # Main documentation
├── QUICKSTART.md                # Quick start guide
├── AUTHORIZATION.md             # License information
├── SECURITY.md                  # Security policy
├── LICENSE                      # Software license
├── CHANGELOG.md                 # Version history
├── CONTRIBUTING.md              # Contribution guidelines
├── .gitignore                   # Git ignore rules
├── .eslintrc.js                 # ESLint config
├── .prettierrc.js               # Prettier config
├── jest.config.js               # Jest test config
└── jest.setup.js                # Jest setup
```

## 📦 Core Files

### KGiTONScaleService.ts
Main service class that handles:
- BLE device scanning and connection
- License key authentication
- Real-time weight data streaming
- Buzzer control
- Connection state management
- Event-based callbacks

### Models
- **ScaleDevice**: Device information (name, id, RSSI, license key)
- **WeightData**: Weight measurement data (weight, timestamp, unit)
- **ControlResponse**: Response from control commands
- **ScaleConnectionState**: Connection state enum

### Constants
- **BLEConstants**: BLE UUIDs, timeouts, and configuration

### Exceptions
- **KGiTONException**: Base exception
- **BLEConnectionException**: BLE connection errors
- **DeviceNotFoundException**: Device not found
- **LicenseKeyException**: Invalid license key
- **AuthenticationException**: Authentication failures

### Utilities
- **DataValidation**: Input validation helpers
- **RetryPolicy**: Retry logic for BLE operations
- **ConnectionStability**: Connection monitoring

## 🎣 Optional Modules

### hooks.ts
React hooks for easier integration:
- `useKGiTONScale()`: Main hook with all state
- `useDeviceScan()`: Device scanning
- `useDeviceConnection()`: Connection management
- `useBuzzer()`: Buzzer control
- `useWeight()`: Weight data processing

### context.tsx
React Context API:
- `ScaleProvider`: Context provider component
- `useScaleContext()`: Hook to access context
- `withScale()`: HOC for class components

## 📚 Documentation Files

- **README.md**: Complete API documentation
- **QUICKSTART.md**: 5-minute getting started guide
- **INTEGRATION.md**: Detailed integration steps
- **TROUBLESHOOTING.md**: Common issues and solutions
- **AUTHORIZATION.md**: Licensing information
- **SECURITY.md**: Security policy
- **CHANGELOG.md**: Version history

## 🔧 Configuration Files

- **package.json**: NPM dependencies and scripts
- **tsconfig.json**: TypeScript compiler options
- **.eslintrc.js**: Code linting rules
- **.prettierrc.js**: Code formatting rules
- **jest.config.js**: Unit test configuration

## 🚀 Build Process

```bash
# Install dependencies
npm install

# Build TypeScript to JavaScript
npm run build
# Output: lib/ directory

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

## 📤 Distribution

After building:
```
lib/
├── KGiTONScaleService.js
├── KGiTONScaleService.d.ts
├── index.js
├── index.d.ts
├── hooks.js
├── hooks.d.ts
├── context.js
├── context.d.ts
├── models/
│   └── ...
├── constants/
│   └── ...
├── exceptions/
│   └── ...
└── utils/
    └── ...
```

## 🔌 Usage Patterns

### Standard Import
```typescript
import { KGiTONScaleService } from '@kgiton/react-native-sdk';
const service = new KGiTONScaleService();
```

### With Hooks
```typescript
import { useKGiTONScale } from '@kgiton/react-native-sdk';
const { service, weight, devices } = useKGiTONScale();
```

### With Context
```typescript
import { ScaleProvider, useScaleContext } from '@kgiton/react-native-sdk';

function App() {
  return (
    <ScaleProvider>
      <MyComponent />
    </ScaleProvider>
  );
}
```

## 🎯 Key Design Principles

1. **Type Safety**: Full TypeScript support with strict typing
2. **Modularity**: Clean separation of concerns
3. **Flexibility**: Multiple integration patterns (direct, hooks, context)
4. **Error Handling**: Comprehensive exception system
5. **Documentation**: Extensive inline docs and guides
6. **Testing**: Jest configuration for unit tests
7. **Code Quality**: ESLint + Prettier for consistency

## 📊 Size Metrics

- **Source Code**: ~15 files, ~1500 lines
- **Dependencies**: 2 peer deps (ble-plx, async-storage)
- **Bundle Size**: ~50-60 KB (minified)
- **TypeScript**: 100% coverage

## 🔄 Version Control

- **main**: Production releases
- **develop**: Development branch
- **feature/***: Feature branches
- **hotfix/***: Critical fixes

## 🎓 Learning Path

1. Start with **QUICKSTART.md**
2. Read **README.md** for API reference
3. Follow **INTEGRATION.md** for setup
4. Check **example/** for complete code
5. Review **TROUBLESHOOTING.md** for issues

## 📝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

**Note**: This is proprietary software. Contributions require authorization.

---

© 2025 PT KGiTON. All rights reserved.
