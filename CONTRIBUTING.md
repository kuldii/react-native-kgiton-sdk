# Contributing to KGiTON React Native SDK

Thank you for your interest in contributing! However, please note:

## ⚠️ Proprietary Software Notice

**KGiTON React Native SDK is proprietary commercial software.**

This is **NOT** an open-source project. The codebase is confidential and owned by PT KGiTON.

## Contribution Policy

### ❌ Public Contributions Not Accepted

We do not accept public contributions, pull requests, or code submissions from unauthorized parties.

### ✅ Authorized Contributors Only

Only employees and authorized contractors of PT KGiTON may contribute to this codebase.

## Reporting Issues

While we don't accept code contributions, we welcome issue reports from authorized SDK users:

### How to Report Issues

1. **Verify Authorization**
   - Ensure you have a valid license
   - Have your license key ready

2. **Check Existing Issues**
   - Search [existing issues](https://github.com/kuldii/react-native-kgiton-sdk/issues)
   - Avoid duplicates

3. **Create Detailed Report**
   - Use issue templates
   - Include reproduction steps
   - Provide environment details
   - Attach relevant logs

### What to Include

- **SDK Version**: e.g., 1.0.0
- **Platform**: iOS or Android
- **OS Version**: e.g., iOS 16.0, Android 12
- **React Native Version**: e.g., 0.72.0
- **License Status**: Active/Valid
- **Error Messages**: Full error logs
- **Steps to Reproduce**: Detailed steps

## Feature Requests

### Submit Feature Requests

Authorized users can submit feature requests via:

- **Email**: support@kgiton.com
- **Subject**: "[FEATURE] Brief description"
- **Include**:
  - Use case description
  - Expected behavior
  - Business justification
  - Priority level

### Feature Request Template

```
Feature: [Brief title]

Use Case:
[Describe the problem or need]

Expected Behavior:
[What should happen]

Alternative Solutions:
[Other approaches considered]

Priority: Low / Medium / High / Critical

Business Impact:
[Why this matters to your business]
```

## Security Vulnerabilities

**DO NOT** post security issues publicly.

Report security vulnerabilities to:
- **Email**: security@kgiton.com
- **Subject**: "[SECURITY] Vulnerability Report"

See [SECURITY.md](SECURITY.md) for details.

## Documentation Feedback

Found errors in documentation?

- **Email**: docs@kgiton.com
- **GitHub Issue**: Tag with `documentation` label

## Support Channels

For authorized users:

### Technical Support
- **Email**: support@kgiton.com
- **Response**: Within 24 hours (business days)

### Sales & Licensing
- **Email**: sales@kgiton.com

### General Inquiries
- **Website**: https://kgiton.com

## Internal Contributors (PT KGiTON Staff)

### Development Workflow

1. **Branch Strategy**
   - `main` - Production releases
   - `develop` - Development branch
   - `feature/*` - Feature branches
   - `hotfix/*` - Urgent fixes

2. **Commit Standards**
   ```
   type(scope): Brief description

   Detailed explanation if needed

   Refs: #issue-number
   ```

   Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

3. **Code Review**
   - All changes require review
   - Minimum 2 approvals for main branch
   - Pass all CI checks

4. **Testing**
   - Write unit tests for new features
   - Ensure integration tests pass
   - Manual testing on iOS and Android

5. **Documentation**
   - Update README.md if API changes
   - Update CHANGELOG.md
   - Add code comments for complex logic

### Development Setup (Internal)

```bash
# Clone repository
git clone git@github.com:kuldii/react-native-kgiton-sdk.git
cd react-native-kgiton-sdk

# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Lint
npm run lint

# Format
npm run format
```

### Release Process (Internal)

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch
4. Test thoroughly
5. Merge to main
6. Tag release
7. Publish to private registry
8. Notify authorized users

## Code of Conduct

### Professional Standards

- Maintain confidentiality
- Respect intellectual property
- Follow company policies
- Provide constructive feedback

### Prohibited Actions

- Sharing proprietary code
- Unauthorized distribution
- Reverse engineering
- Bypassing license checks

## Questions?

### For Authorized Users
Contact: support@kgiton.com

### For Internal Team
Contact: dev-team@kgiton.com

---

**Remember**: This is proprietary software. All contributions become the property of PT KGiTON.

© 2025 PT KGiTON. All rights reserved.
