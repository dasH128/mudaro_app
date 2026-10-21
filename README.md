# Mudaro

Monorepo con pnpm workspaces y Turborepo. Reglas y decisiones en [CLAUDE.md](CLAUDE.md) y [docs/](docs/).

```
apps/
  landing/    mudaro.pt          (puerto 3000)
  empresa/    app.mudaro.pt      (puerto 3001)
packages/
  config/     tsconfig y eslint compartidos
  supabase/   cliente, tipos y helpers de auth (sin conectar)
```

## Comandos

```bash
corepack enable          # una vez, activa la versión de pnpm fijada en package.json
pnpm install
pnpm dev --filter=landing   # o --filter=empresa
pnpm build
pnpm lint && pnpm typecheck
```

Idiomas y tema de `apps/empresa`: ver [apps/empresa/README.md](apps/empresa/README.md).
