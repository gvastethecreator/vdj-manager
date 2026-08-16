# Security Policy

## Reporting a vulnerability

Please report security issues through GitHub's private vulnerability reporting feature. Do not open a public issue for an undisclosed vulnerability.

Include the affected version, reproduction steps, impact, and any suggested mitigation. Avoid attaching real VirtualDJ databases, music paths, or other private library data.

## Safety model

VDJ Manager treats filesystem and `database.xml` mutations as safety-critical. The application uses backups, validation, optimistic concurrency checks, atomic commits, no-clobber operations, a per-library journal, and recovery gates. Reports that bypass any of these controls are especially valuable.
