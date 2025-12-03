# Android Setup Guide

Complete guide for Android-specific configuration and setup.

## Overview

This guide covers all Android-specific requirements, permissions, and configurations needed to integrate the KGiTON SDK.

---

## Requirements

- **Android Studio**: 4.1 or higher
- **Gradle**: 7.0 or higher  
- **Min SDK**: API 21 (Android 5.0)
- **Target SDK**: API 34 (Android 14)
- **Compile SDK**: API 34
- **Build Tools**: 34.0.0
- **Java**: JDK 11 or higher

---

## Project Configuration

### 1. Update build.gradle (Project Level)

```gradle
// android/build.gradle
buildscript {
    ext {
        buildToolsVersion = "34.0.0"
        minSdkVersion = 21
        compileSdkVersion = 34
        targetSdkVersion = 34
        ndkVersion = "25.1.8937393"
        kotlinVersion = "1.8.0"
    }
    
    repositories {
        google()
        mavenCentral()
    }
    
    dependencies {
        classpath("com.android.tools.build:gradle:8.1.1")
        classpath("com.facebook.react:react-native-gradle-plugin")
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
        maven { url 'https://jitpack.io' }
    }
}
```

### 2. Update build.gradle (App Level)

```gradle
// android/app/build.gradle
apply plugin: "com.android.application"
apply plugin: "com.facebook.react"

android {
    namespace "com.yourapp"
    compileSdkVersion rootProject.ext.compileSdkVersion
    buildToolsVersion rootProject.ext.buildToolsVersion

    defaultConfig {
        applicationId "com.yourapp"
        minSdkVersion rootProject.ext.minSdkVersion
        targetSdkVersion rootProject.ext.targetSdkVersion
        versionCode 1
        versionName "1.0"
    }

    signingConfigs {
        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
        release {
            // Configure for release build
            if (project.hasProperty('MYAPP_RELEASE_STORE_FILE')) {
                storeFile file(MYAPP_RELEASE_STORE_FILE)
                storePassword MYAPP_RELEASE_STORE_PASSWORD
                keyAlias MYAPP_RELEASE_KEY_ALIAS
                keyPassword MYAPP_RELEASE_KEY_PASSWORD
            }
        }
    }

    buildTypes {
        debug {
            signingConfig signingConfigs.debug
        }
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
        }
    }

    packagingOptions {
        pickFirst '**/libc++_shared.so'
        pickFirst '**/libfbjni.so'
    }
}

dependencies {
    implementation "com.facebook.react:react-android"
    
    // SDK dependencies (automatically included)
    // No manual BLE library needed
    
    debugImplementation("com.facebook.flipper:flipper:${FLIPPER_VERSION}")
    debugImplementation("com.facebook.flipper:flipper-network-plugin:${FLIPPER_VERSION}") {
        exclude group:'com.squareup.okhttp3', module:'okhttp'
    }
}
```

---

## Permissions Configuration

### AndroidManifest.xml

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
          xmlns:tools="http://schemas.android.com/tools">

    <!-- Bluetooth Permissions for Android 12+ (API 31+) -->
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN"
                     android:usesPermissionFlags="neverForLocation"
                     tools:targetApi="s" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

    <!-- Bluetooth Permissions for Android 11 and below (API 30-) -->
    <uses-permission android:name="android.permission.BLUETOOTH"
                     android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN"
                     android:maxSdkVersion="30" />

    <!-- Location Permission (required for BLE on Android < 12) -->
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION"
                     android:maxSdkVersion="30" />
    <uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION"
                     android:maxSdkVersion="30" />

    <!-- Declare BLE feature required -->
    <uses-feature android:name="android.hardware.bluetooth_le" android:required="true" />

    <application
        android:name=".MainApplication"
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:allowBackup="false"
        android:theme="@style/AppTheme"
        android:usesCleartextTraffic="true"
        tools:targetApi="31">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="keyboard|keyboardHidden|orientation|screenLayout|screenSize|smallestScreenSize|uiMode"
            android:launchMode="singleTask"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

---

## Runtime Permission Request

### Permission Helper

```typescript
// utils/androidPermissions.ts
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';

export const requestAndroidBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  // Android 12+ (API 31+)
  if (Platform.Version >= 31) {
    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
      ]);

      const scanGranted = granted['android.permission.BLUETOOTH_SCAN'] === PermissionsAndroid.RESULTS.GRANTED;
      const connectGranted = granted['android.permission.BLUETOOTH_CONNECT'] === PermissionsAndroid.RESULTS.GRANTED;

      if (!scanGranted || !connectGranted) {
        showPermissionDeniedAlert();
        return false;
      }

      return true;
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // Android 11 and below (API 30-)
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'Location Permission',
        message: 'Bluetooth scanning requires location permission on Android 11 and below',
        buttonPositive: 'OK',
        buttonNegative: 'Cancel',
      }
    );

    if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
      showPermissionDeniedAlert();
      return false;
    }

    return true;
  } catch (error) {
    console.error('Permission request error:', error);
    return false;
  }
};

const showPermissionDeniedAlert = () => {
  Alert.alert(
    'Permission Required',
    'Bluetooth permissions are required to scan for and connect to scale devices.',
    [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Open Settings', 
        onPress: () => Linking.openSettings() 
      },
    ]
  );
};

export const checkBluetoothPermissions = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return true;
  }

  if (Platform.Version >= 31) {
    const scanGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN
    );
    const connectGranted = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT
    );

    return scanGranted && connectGranted;
  }

  return await PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
  );
};
```

### Usage in App

```typescript
// App.tsx
import { requestAndroidBluetoothPermissions } from './utils/androidPermissions';

const App = () => {
  useEffect(() => {
    // Request permissions on mount
    requestAndroidBluetoothPermissions();
  }, []);

  const handleScan = async () => {
    const hasPermission = await requestAndroidBluetoothPermissions();
    
    if (!hasPermission) {
      Alert.alert('Permission Required', 'Cannot scan without permissions');
      return;
    }

    await service.scanForDevices(15000);
  };

  return <YourApp />;
};
```

---

## ProGuard Configuration

### proguard-rules.pro

```proguard
# Add project specific ProGuard rules here.
# By default, the flags in this file are appended to flags specified
# in /usr/local/Cellar/android-sdk/24.3.3/tools/proguard/proguard-android.txt

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# BLE Library
-keep class com.polidea.reactnativeble.** { *; }
-keepclassmembers class com.polidea.reactnativeble.** { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# KGiTON SDK
-keep class com.kgiton.** { *; }
-keepclassmembers class com.kgiton.** { *; }

# Bluetooth classes
-keep class android.bluetooth.** { *; }
-keep class android.bluetooth.le.** { *; }

# Prevent obfuscation of native methods
-keepclasseswithmembernames,includedescriptorclasses class * {
    native <methods>;
}

# Keep JS interfaces
-keepclassmembers,includedescriptorclasses class * {
    @android.webkit.JavascriptInterface <methods>;
}

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

---

## Gradle Properties

### gradle.properties

```properties
# Project-wide Gradle settings
android.useAndroidX=true
android.enableJetifier=true

# Increase memory
org.gradle.jvmargs=-Xmx4096m -XX:MaxPermSize=512m -XX:+HeapDumpOnOutOfMemoryError -Dfile.encoding=UTF-8

# Enable Gradle daemon
org.gradle.daemon=true

# Enable parallel builds
org.gradle.parallel=true

# Enable caching
org.gradle.caching=true

# React Native
hermesEnabled=true
reactNativeArchitectures=armeabi-v7a,arm64-v8a,x86,x86_64

# Flipper (Debug only)
FLIPPER_VERSION=0.182.0
```

---

## Debugging

### Enable USB Debugging

1. Go to **Settings** → **About Phone**
2. Tap **Build Number** 7 times
3. Go back to **Settings** → **Developer Options**
4. Enable **USB Debugging**
5. Connect device via USB
6. Run: `adb devices` to verify

### View Logs

```bash
# View all logs
adb logcat

# Filter React Native logs
adb logcat | grep ReactNativeJS

# Filter BLE logs
adb logcat | grep BLE

# Clear logs
adb logcat -c

# Save logs to file
adb logcat > logs.txt
```

### Debug with Android Studio

1. Open `android/` folder in Android Studio
2. Click **Run** → **Debug 'app'**
3. Set breakpoints in native code
4. View logs in **Logcat** panel

---

## Build Commands

### Debug Build

```bash
# Build debug APK
cd android
./gradlew assembleDebug
# Output: android/app/build/outputs/apk/debug/app-debug.apk

# Install debug APK
./gradlew installDebug

# Or use React Native CLI
npm run android
```

### Release Build

```bash
# Build release APK
cd android
./gradlew assembleRelease
# Output: android/app/build/outputs/apk/release/app-release.apk

# Build release AAB (for Play Store)
./gradlew bundleRelease
# Output: android/app/build/outputs/bundle/release/app-release.aab
```

### Signing Configuration

```properties
# android/gradle.properties (add these)
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your-store-password
MYAPP_RELEASE_KEY_PASSWORD=your-key-password
```

---

## Troubleshooting

### Build Fails with "Duplicate Class" Error

```bash
# Clean build
cd android
./gradlew clean
cd ..
npm start -- --reset-cache
npm run android
```

### "SDK location not found"

Create `android/local.properties`:

```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
# Or on Windows:
# sdk.dir=C:\\Users\\YOUR_USERNAME\\AppData\\Local\\Android\\Sdk
```

### Gradle Sync Fails

```bash
# Update Gradle Wrapper
cd android
./gradlew wrapper --gradle-version=8.1.1

# Or in gradle-wrapper.properties:
# distributionUrl=https\://services.gradle.org/distributions/gradle-8.1.1-all.zip
```

### BLE Not Working

1. Check `AndroidManifest.xml` has all permissions
2. Request runtime permissions
3. Verify device has BLE hardware
4. Check Bluetooth is enabled
5. Test on physical device (not emulator)

---

## Testing on Device

### Via USB

```bash
# List connected devices
adb devices

# Run on specific device
npx react-native run-android --deviceId=DEVICE_ID

# Or
npm run android
```

### Via Wi-Fi (ADB Wireless)

```bash
# Connect device via USB first
adb tcpip 5555

# Find device IP (Settings → About → Status)
adb connect 192.168.1.XXX:5555

# Disconnect USB
# Now run as usual
npm run android
```

---

## Performance Optimization

### Enable Hermes

```gradle
// android/app/build.gradle
project.ext.react = [
    enableHermes: true
]
```

### Reduce APK Size

```gradle
android {
    buildTypes {
        release {
            // Enable ProGuard/R8
            minifyEnabled true
            shrinkResources true
            
            // Split by ABI
            splits {
                abi {
                    enable true
                    reset()
                    include "armeabi-v7a", "arm64-v8a", "x86", "x86_64"
                    universalApk false
                }
            }
        }
    }
}
```

---

## Common Issues

### "Cleartext HTTP traffic not permitted"

Add to `AndroidManifest.xml`:

```xml
<application
    android:usesCleartextTraffic="true">
</application>
```

Or use `android:networkSecurityConfig`:

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="true">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
```

### Permission Denied Even After Granting

```typescript
// Sometimes need to request again
const result = await PermissionsAndroid.request(permission);

if (result === 'never_ask_again') {
  // User selected "Don't ask again"
  // Must open settings manually
  Linking.openSettings();
}
```

---

## See Also

- [Installation Guide](./02-installation.md)
- [Troubleshooting](./19-troubleshooting.md)
- [iOS Setup](./21-ios-setup.md)
- [Testing Guide](./14-testing.md)
