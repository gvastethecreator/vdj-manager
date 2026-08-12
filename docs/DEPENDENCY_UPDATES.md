# Actualización de dependencias

Fecha: 2026-08-12

VDJ Manager conserva Bun 1.3.14 de forma explícita: tests usan `bun:test` y los
hooks Tauri ejecutan `bun run`. `bun update --latest` actualizó Tauri API/CLI y
plugins, React 19.2.8, Lucide 1.31, Tailwind/Vite 4.3/8.2, TypeScript 7, OXC
1.78, Happy DOM 20.11 y tipos React actuales.

Se revisaron changelogs oficiales de Tauri, React, Vite, Tailwind, TypeScript,
OXC y testing-library. No se fuerza pnpm porque Bun es requisito operativo;
`packageManager` queda declarado para reproducibilidad.

```powershell
bun install --frozen-lockfile
bun run deps:check
bun run audit
```
