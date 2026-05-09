# CLAUDE.md — cade-meu-onibus

## O que é

App mobile de rastreamento em tempo real dos ônibus da SPTrans (São Paulo), consumindo a
API Olho Vivo: busca de linha com autocomplete e histórico, mapa Google Maps com marcadores
por status e auto-refresh a cada 30s.

## Stack e gerenciador

- **Expo ~54** + **React Native 0.81** + **TypeScript** (React 19)
- **NativeWind 2** (Tailwind 3) para estilos — via `className`, não `StyleSheet.create`
- **React Navigation** (stack + bottom-tabs), **react-native-maps** (PROVIDER_GOOGLE)
- **@tanstack/react-query** (dados de servidor/cache) + **zustand** (estado de UI por domínio)
- **react-hook-form + zod** (`@hookform/resolvers`) para formulários/validação
- **Gerenciador: npm** (`package-lock.json`). Nunca usar bun, yarn ou pnpm aqui;
  nunca introduzir outro lockfile.

## Comandos

- `npm start` — dev server Expo (`npx expo start --clear` para resetar cache)
- `npm run android` / `npm run ios` / `npm run web`
- Type-check: `npx tsc --noEmit` (não há script de lint/test no package.json)

## Convenções deste repo

- Estrutura em `src/`: `components/` (`ui/`, `maps/`), `screens/`, `services/`,
  `stores/`, `hooks/`, `schemas/`, `types/`, `constants/`, `utils/`
- **Named exports sempre** — nunca `export default`; nunca `React.FC`
- Componentes como **function declarations**; arrow functions só para callbacks/handlers
- Arquivos em **kebab-case** (`map-screen.tsx`, `bus-store.ts`); componentes em PascalCase;
  constantes em SCREAMING_SNAKE_CASE
- Handlers: `handle<Evento>` (interno) / `on<Ação>` (prop)
- Schemas zod em `src/schemas/`; forms com `useForm` + `zodResolver` (`mode: 'onChange'`)
- Cores do design system em `tailwind.config.js` (primária SPTrans `primary-500` #b91c1c)
- Commits: convenção global (inglês, emoji + conventional commits, sem atribuição de IA)

## Cuidados

- `src/constants/api.ts` — `API_CONFIG.BASE_URL` aponta para um **backend proxy local**
  (IP da máquina na rede, porta 3000); ajustar por ambiente, não hardcodar em outros lugares
- Segredos: token SPTrans e Google Maps API key (em `app.json`) — não expor novos segredos
  em código commitado; env local em `.env*.local` (gitignorado)
- API Olho Vivo é instável e tem rate limit: preservar retry/backoff, timeout de 10s,
  throttle de refresh (30s) e fallbacks offline existentes
- Debounce de 300ms nos inputs de busca; cleanup de intervals/listeners ao desmontar
- Não editar `/ios` e `/android` (gerados, gitignorados); mudanças nativas via `app.json`/plugins
- Documentação extensa de produto/API/histórico fica em `docs.md` e `README.md`
