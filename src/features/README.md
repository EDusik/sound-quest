# Features

Este diretório agrupa código **por domínio do produto** (ex.: `scenes`, `library`, `ai`), em vez de por camada técnica.

## Convenções
- `components/`: UI específica do domínio (não “shared”)
- `hooks/`: hooks específicos do domínio
- `api/`: wrappers/hooks de API (ex.: TanStack Query) do domínio
- `model/`: types, zod schemas e mappers do domínio
- `server/`: código **server-only** (usado por `src/app/api/**`), sem uso direto em componentes client

