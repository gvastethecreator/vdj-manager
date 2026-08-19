# Certification notes

Use these notes in Partner Center after replacing placeholders with the exact release version and test environment.

## Product

VDJ Manager is a Windows desktop utility for inspecting and maintaining VirtualDJ 8+ libraries. It can inspect libraries without writing them and provides explicit, protected mutation workflows for rename, move, tag and resource operations.

## Test path

1. Install the submitted x64 installer on a clean Windows 10/11 VM.
2. Launch without a VirtualDJ library configured.
3. Open a read-only fixture library.
4. Verify songs, playlists, metadata and resource views.
5. Run a preview-only repair operation and cancel it.
6. Create a disposable fixture directory and perform a mutation.
7. Verify backup, journal and atomic commit evidence.
8. Restart after an injected failure and verify recovery.
9. Uninstall the application.
10. Verify the user's library and documents remain intact.

## Network / privacy

Normal library inspection and mutation are local operations. The application does not require an account for core filesystem workflows and does not upload the user's music library as part of the normal product path.

## Certification caveat

Do not claim support for VirtualDJ installations or library variants that were not exercised by the submitted build. Replace this document with the exact tested version, OS builds, VirtualDJ fixture versions and known limitations before submission.
