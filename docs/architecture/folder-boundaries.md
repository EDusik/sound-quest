# Folder boundaries

Este documento define limites de dependência (“quem pode importar quem”) para manter o projeto organizado conforme a migração para `features/` e `shared/`.

## Regras

### `src/app/**` (Next App Router)
- Pode importar de `src/features/**`, `src/shared/**`, `src/contexts/**`, `src/store/**`, `src/lib/**` (enquanto existir compat layer).
- Deve evitar concentrar regra de negócio. Preferir delegar para `features/**`.

### `src/shared/**`
- **Não pode depender** de `src/features/**`.
- Pode depender de libs externas e de utilitários internos do próprio `shared/**`.

### `src/features/**`
- Pode depender de `src/shared/**`.
- Evitar dependência cruzada direta entre features (ex.: `features/library` importando internals de `features/scenes`). Quando algo for realmente transversal, promover para `shared/**`.

### `features/**/server/**` (server-only)
- Código que usa segredos/env server-only, service role, ou integrações server-side.
- Pode ser importado por `src/app/api/**` e por outros módulos server-only.
- **Não deve ser importado** por componentes client (`"use client"`).

## Convenções de import
- Preferir imports via alias `@/…`.
- Durante a migração, usar reexports/compat layer nos caminhos antigos para minimizar quebras.

