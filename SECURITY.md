# Security Policy

## Reporting a vulnerability

If you discover a security issue in this repository, please report it immediately by email to arseneferret@gmail.com with subject line:

`[Security] [monsite] Vulnerability report`

Include:
- A clear description of the issue
- Steps to reproduce
- A short impact assessment
- Any suggested remediation

## Expected response

You should receive an acknowledgement within 24 hours.

## Upstream disclosure policy

- Coordinated disclosure: 30 days
- Full disclosure after vendor fix, or 30 days, whichever comes first

## Security contact

- Email: arseneferret@gmail.com

## Supported versions

- This project is a static site, no runtime dependencies currently.

## Hardening guidelines

- Inputs are sanitized with DOMPurify where externally loaded HTML is used
- Always use HTTPS to access the site
- Regular review of external libraries for CVE updates
