# GitHub Pages deployment

VDJ Manager is a Windows desktop application. Its GitHub Pages site runs the deterministic in-memory demo so visitors can explore the interface without Tauri or access to local files.

The `Pages` workflow verifies the frontend, builds with `/vdj-manager/` as the base path, uploads `dist`, and deploys it through GitHub Actions. The `.env.pages` file enables demo mode for that build.

Local production check:

```powershell
bun run build:pages
bunx vite preview --base=/vdj-manager/
```

Never add real database exports, music paths, or user library data to the demo fixtures or repository assets.
