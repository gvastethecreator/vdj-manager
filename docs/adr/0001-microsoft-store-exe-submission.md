# ADR 0001: Microsoft Store EXE submission

## Status

Accepted for preparation; submission pending.

## Context

VDJ Manager is already a Tauri v2 Windows application with a native Rust backend and existing Tauri bundling. Repackaging the product solely for Store distribution would add unnecessary migration risk while the product's filesystem safety contracts are still being qualified.

## Decision

Prepare the Microsoft Store **EXE/MSI installer submission** path first. Keep the normal Tauri configuration unchanged and isolate Store packaging in `tauri.microsoftstore.conf.json`.

This preserves the current application architecture and makes Store-specific requirements explicit: signing, immutable hosting, updater ownership and lifecycle evidence.

## Consequences

Positive:

- minimal packaging delta;
- no migration of the native application runtime;
- Store certification can exercise the same native product users receive directly;
- Store-specific release contracts remain auditable.

Negative:

- the publisher must maintain Authenticode signing;
- updates remain the publisher's responsibility;
- clean-VM lifecycle evidence is mandatory before submission.

## Revisit

Reconsider MSIX if Store-managed updates, differential packages or stronger sandboxing become more valuable than compatibility with the existing Tauri installer and filesystem workflow.
