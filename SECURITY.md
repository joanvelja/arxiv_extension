# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

1. **Do NOT create a public GitHub issue**
2. Send an email to [your-email@example.com] with:
   - A description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

## Response Timeline

- Initial response: Within 48 hours
- Status update: Within 5 business days
- Fix timeline: Depends on severity and complexity

## Security Measures

This extension implements several security measures:

1. Content Security Policy (CSP)
2. Minimal permission model
3. No external dependencies in runtime
4. Local-only data processing
5. Strong input validation

## Best Practices

When contributing:

1. Never commit sensitive information
2. Keep dependencies up to date
3. Follow secure coding practices
4. Use TypeScript's strict mode
5. Add appropriate error handling

## Code Review

All changes undergo:

1. Automated security scanning
2. Type checking
3. Linting
4. Manual code review
5. Testing in isolated environment

## Third-Party Dependencies

Dependencies are:
- Regularly audited
- Updated promptly
- Kept to minimum
- Verified through npm audit 