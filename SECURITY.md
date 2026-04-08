# Security Policy

## Overview

This policy describes how security issues should be reported for Princeps.

Princeps handles authenticated chat, personal knowledge entries, uploaded documents, and assistant configuration. Any issue affecting account access, stored user data, API protection, document handling, or model/provider configuration should be treated as security-relevant.

## Supported Versions

Security fixes are provided for the active mainline version only.

| Version        | Supported | Notes                         |
| -------------- | --------- | ----------------------------- |
| Latest         | Yes       | Active development            |
| Older versions | No        | Upgrade to the latest version |

## Reporting a Vulnerability

Please report vulnerabilities privately by email:

- contact@coldbydefault.com
- abo.ayash.yazan@gmail.com

Include, when possible:

- a short description of the issue
- affected area or endpoint
- reproduction steps or proof of concept
- expected impact

Please do not disclose the issue publicly before it has been reviewed and addressed.

## Response Approach

After a valid report is received, the issue will be reviewed, triaged, and fixed according to severity and impact. Sensitive details may be withheld from public notes until remediation is available.

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [Prisma Security](https://www.prisma.io/docs/guides/database/advanced-database-tasks/sql-injection)
