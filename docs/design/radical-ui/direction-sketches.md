# Sprint de direcciones

Mismo input: Biblioteca demo con cinco tracks catalogados, una entrada descubierta y una recuperación posible. Viewport de comparación: 1280×800.

## Direction A — Centro operativo

```text
┌──────┬───────────────────────────────────────────────────────────────┐
│ rail │ Biblioteca activa · 5 tracks        Mutaciones: protegidas ▾ │
├──────┼───────────────────────────────────────────────────────────────┤
│  D   │ QUÉ REQUIERE ATENCIÓN                                        │
│  B   │ [1] Metadata incompleta   1 track   → Abrir en Biblioteca     │
│  !   │ [—] Archivos faltantes    Sin verificar → Verificar ahora    │
│  ⇄   │                                                               │
│  R   │ PRÓXIMO PASO                       Contexto compacto           │
│      │ Completar track descubierto         5 tracks · 145.8 MB        │
└──────┴───────────────────────────────────────────────────────────────┘
```

Memoria: cola estable `estado → evidencia → acción`. La cápsula describe protección de escrituras; la cola describe salud/verificación de la biblioteca, sin mezclar ambos estados.

## Direction B — Browser soberano

```text
┌──────┬────────────┬────────────────────────────┬─────────────────────┐
│ rail │ Fuentes    │ Tabla de tracks            │ Evidencia/acciones  │
│      │ Biblioteca │ You & Me · Disclosure      │ waveform + tags     │
│      │ Playlists  │ To My Love · Bomba Estéreo │ integridad          │
│      │ History    │ ...                         │ mover / remover      │
└──────┴────────────┴────────────────────────────┴─────────────────────┘
```

Memoria: toda acción se origina en una selección de track.

## Direction C — Cadena de integridad

```text
┌──────┬───────────────────────────────────────────────────────────────┐
│ rail │ 1 Cargar ─ 2 Verificar ─ 3 Revisar ─ 4 Reparar ─ 5 Reportar  │
├──────┼───────────────────────────────────────────────────────────────┤
│      │ ETAPA ACTUAL: VERIFICAR                                      │
│      │ Alcance / fuentes / freshness                                │
│      │ Resultados exactos + bloqueos + siguiente etapa              │
└──────┴───────────────────────────────────────────────────────────────┘
```

Memoria: una Biblioteca avanza sólo con evidencia de cada etapa.

## Elección

Se implementa A. B queda como composición interna de Biblioteca; C aporta la gramática de evidencia a Resolver problemas, sin convertir todo el producto en un flujo lineal.
