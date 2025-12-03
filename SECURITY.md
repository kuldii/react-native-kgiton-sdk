# KGiTON React Native SDK - Security Policy

## 🔒 Security Overview

PT KGiTON takes the security of our SDK and your applications seriously. This document outlines our security practices and how to report vulnerabilities.

## 🛡️ Supported Versions

We provide security updates for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | ✅ Yes             |
| < 1.0   | ❌ No              |

## 🔐 Security Features

### Built-in Security

1. **License Key Authentication**
   - Encrypted license key validation
   - Per-device authentication
   - Secure key storage using AsyncStorage

2. **BLE Security**
   - Encrypted BLE communication
   - UUID-based service identification
   - Authentication before data access

3. **Data Protection**
   - No sensitive data logging
   - Secure storage of credentials
   - Input validation and sanitization

4. **Connection Security**
   - Timeout protection
   - Connection state verification
   - Auto-disconnect on authentication failure

## 🔍 Best Practices

### For Developers Using This SDK

1. **License Key Management**
   ```typescript
   // ❌ DON'T: Hardcode license keys
   const LICENSE_KEY = 'YOUR-ACTUAL-LICENSE-KEY';
   
   // ✅ DO: Let users input license key via secure TextInput
   <TextInput
     placeholder="Enter License Key"
     value={licenseKey}
     onChangeText={setLicenseKey}
     secureTextEntry
   />
   
   // SDK automatically stores it securely in AsyncStorage after successful connection
   await service.connectWithLicenseKey(deviceId, licenseKey);
   ```

2. **Permission Handling**
   ```typescript
   // Always check permissions before using SDK
   const hasPermissions = await requestPermissions();
   if (!hasPermissions) {
     // Handle permission denial
   }
   ```

3. **Error Handling**
   ```typescript
   try {
     await scaleService.connectWithLicenseKey(deviceId, licenseKey);
   } catch (error) {
     // Don't expose internal errors to users
     console.error('Connection failed:', error);
     // Show user-friendly message
   }
   ```

4. **Connection Cleanup**
   ```typescript
   // Always cleanup on component unmount
   useEffect(() => {
     return () => {
       scaleService.dispose();
     };
   }, []);
   ```

5. **Data Validation**
   ```typescript
   // Validate weight data before use
   if (weightData && weightData.weight > 0 && weightData.weight < 9999) {
     // Use data
   }
   ```

## 🚨 Reporting Vulnerabilities

### How to Report

If you discover a security vulnerability, please report it responsibly:

**DO NOT** create a public GitHub issue for security vulnerabilities.

Instead, email us at:
- **Email**: security@kgiton.com
- **Subject**: "[SECURITY] React Native SDK Vulnerability Report"

### What to Include

Your report should include:

1. **Description**
   - Clear description of the vulnerability
   - Potential impact and severity

2. **Reproduction Steps**
   - Detailed steps to reproduce
   - Code samples if applicable
   - Environment details (OS, React Native version, etc.)

3. **Impact Assessment**
   - What data is at risk
   - Who is affected
   - Potential attack scenarios

4. **Suggested Fix** (optional)
   - Your recommendation for fixing the issue

### Example Report

```
Subject: [SECURITY] React Native SDK Vulnerability Report

Description:
Potential information disclosure through verbose error messages

Steps to Reproduce:
1. Connect to device with invalid license key
2. Observe error message containing sensitive info
3. ...

Impact:
- License key format exposed
- Device identifiers visible
- Affects all SDK users

Suggested Fix:
Sanitize error messages to remove sensitive data

Environment:
- React Native: 0.72.0
- SDK Version: 1.0.0
- Platform: Android 12
```

## 📬 Response Process

### Timeline

1. **Acknowledgment**: Within 24 hours
2. **Initial Assessment**: Within 3 business days
3. **Fix Development**: Varies by severity
4. **Patch Release**: ASAP after testing
5. **Public Disclosure**: After patch is available

### Severity Levels

- **Critical**: Immediate attention (24-48 hours)
- **High**: Priority fix (1 week)
- **Medium**: Regular fix (2-4 weeks)
- **Low**: Future release (as scheduled)

## 🏆 Security Rewards

We appreciate responsible disclosure and may offer:

- Public acknowledgment (with your permission)
- Free license upgrade
- Monetary reward (for critical issues)

Rewards are determined on a case-by-case basis depending on:
- Vulnerability severity
- Quality of report
- Responsible disclosure practices

## 🔄 Security Updates

### How to Stay Updated

1. **Subscribe to Updates**
   - Email: security-updates@kgiton.com
   - Include your company name and contact

2. **Monitor Releases**
   - Check [CHANGELOG.md](CHANGELOG.md) regularly
   - Watch GitHub repository for releases

3. **Update Promptly**
   ```bash
   npm update @kgiton/react-native-sdk
   # or
   yarn upgrade @kgiton/react-native-sdk
   ```

### Security Advisories

We publish security advisories at:
- https://github.com/kuldii/react-native-kgiton-sdk/security/advisories
- Email notifications to registered users

## 🛠️ Secure Development

### Code Review

All SDK code undergoes:
- Internal security review
- Static analysis (ESLint, TypeScript strict mode)
- Dependency vulnerability scanning
- Penetration testing (for major releases)

### Dependencies

We regularly:
- Update dependencies
- Scan for known vulnerabilities
- Remove unused dependencies
- Use only trusted packages

### Compliance

Our SDK complies with:
- OWASP Mobile Security Guidelines
- React Native Security Best Practices
- BLE Security Standards
- Data Protection Regulations

## 📋 Security Checklist

### For Users of This SDK

- [ ] Store license keys securely (environment variables)
- [ ] Request minimum required permissions
- [ ] Validate all input data
- [ ] Handle errors gracefully
- [ ] Clean up connections properly
- [ ] Keep SDK updated
- [ ] Monitor security advisories
- [ ] Test security in your app
- [ ] Review third-party dependencies
- [ ] Follow principle of least privilege

## 🔗 Additional Resources

- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [React Native Security](https://reactnative.dev/docs/security)
- [BLE Security Guide](https://www.bluetooth.com/learn-about-bluetooth/bluetooth-technology/bluetooth-security/)

## 📞 Contact

### Security Team
- **Email**: security@kgiton.com
- **PGP Key**: Available on request
- **Response Time**: Within 24 hours

### General Support
- **Email**: support@kgiton.com
- **Website**: https://kgiton.com

---

**Thank you for helping keep KGiTON SDK and our users safe!**

© 2025 PT KGiTON. All rights reserved.
