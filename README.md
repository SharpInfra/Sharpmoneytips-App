# SharpMoneyTips Mobile App — Phase 3.0 Foundation

**Status:** Phase 3.0 foundation complete, ready for visual strategy (Phase 3.1)

A production-grade B2C mobile app foundation built with React Native (Expo) and TypeScript, engineered to Fortune-50 standards. This is the core platform foundation—no mocks, no fake APIs, architected to scale to millions of users.

## 🎯 Philosophy

This is **not a demo**. This is a **flagship platform foundation** with:

- **Zero mock data** — Only stubs for business logic
- **Investment-grade architecture** — Domain-driven design, clean separation of concerns
- **TypeScript strict mode** — Full type safety, zero `any` types allowed
- **Zero console warnings** — Production-ready code quality
- **Zero unused dependencies** — Lean, intentional package selection

## 📦 Stack

| Layer               | Technology              | Version | Notes                           |
| ------------------- | ----------------------- | ------- | ------------------------------- |
| **Runtime**         | React Native            | 0.81.5  | Bare minimum, Expo-managed      |
| **Framework**       | Expo                    | 54.0.31 | Non-ejected, cloud-native       |
| **Language**        | TypeScript              | 5.9     | Strict mode, no flexibility     |
| **Navigation**      | React Navigation        | 6.x     | Proven, battle-tested           |
| **State**           | Zustand                 | 4.5     | Minimal, functional, performant |
| **Styling**         | React Native Stylesheet | Native  | No CSS-in-JS, native primitives |
| **Package Manager** | pnpm                    | 9.1.4   | Fast, deterministic lockfile    |
| **Linting**         | ESLint + TypeScript     | Latest  | Zero tolerance policy           |
| **Formatting**      | Prettier                | 3.7     | Opinionated, automated          |

## 🏗️ Architecture

### Directory Structure

```
src/
├── App.tsx                 # Root app component with initialization
├── components/             # UI primitives (zero business logic)
│   ├── Badge.tsx
│   ├── Card.tsx
│   ├── EmptyState.tsx
│   ├── ErrorState.tsx
│   ├── ListItem.tsx
│   ├── Loader.tsx
│   └── StatusLabel.tsx
├── i18n/                   # Internationalization placeholder
│   ├── config.ts
│   └── index.ts
├── modules/                # Domain modules (future expansion)
├── navigation/             # Navigation layer (auth-guarded)
│   ├── AppNavigator.tsx
│   ├── RootNavigator.tsx
│   └── index.ts
├── screens/                # Screen components (minimal UI)
│   ├── AuthScreen.tsx
│   ├── HomeScreen.tsx
│   └── index.ts
├── services/               # API client, storage, external services
│   ├── apiClient.ts        # Tenant-aware HTTP client
│   ├── storage.ts          # Local persistence wrapper
│   └── index.ts
├── store/                  # State management (Zustand)
│   ├── appStore.ts         # Global app state
│   ├── authStore.ts        # Auth session state
│   └── index.ts
├── theme/                  # Design tokens (no colors)
│   ├── index.ts
│   ├── radius.ts
│   ├── spacing.ts
│   └── typography.ts
├── types/                  # Type definitions
│   └── index.ts
└── utils/                  # Pure functions (errors, validation)
    ├── errors.ts
    ├── index.ts
    └── validation.ts
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ (use `nvm` for version management)
- **pnpm** 9.1.4+ (`npm install -g pnpm`)
- **Expo Go** app (for simulator/device testing)

### Installation

```bash
# Clone and install
git clone https://github.com/SharpInfra/Sharpmoneytips-App.git
cd Sharpmoneytips-App

# Install dependencies
pnpm install

# Verify setup
pnpm run typecheck
pnpm run lint:check
```

### Development

```bash
# Start development server
pnpm start

# Run on specific platform
pnpm start:web     # Web (fastest iteration)
pnpm android       # Android emulator
pnpm ios           # iOS simulator (macOS only)
```

### Quality Checks

```bash
# Type checking
pnpm run typecheck

# Lint checking (read-only)
pnpm run lint:check

# Format checking (read-only)
pnpm run format:check

# Auto-fix issues
pnpm run lint      # ESLint auto-fix
pnpm run format    # Prettier auto-fix

# Full CI pipeline
pnpm run ci        # typecheck + lint + format check
```

## 🔌 API Integration

The `ApiClient` is tenant-aware and production-ready:

```typescript
import { apiClient } from '@services/index';

// Automatically includes headers:
// - X-Tenant-ID, X-Brand-ID, X-Locale
// - Authorization (Bearer token)

const response = await apiClient.get<UserDTO>('/users/me');

if (response.error) {
  console.error(response.error.code, response.error.message);
} else {
  console.log(response.data);
}
```

## 🎨 Theme System

**Design tokens only** — no colors locked in yet. Ready for Phase 3.1 visual strategy.

```typescript
import { spacing, typography, borderRadius } from '@theme/index';

// Use semantic tokens
const padding = spacing.md; // 16px
const fontSize = typography.sizes.base; // 16px
const radius = borderRadius.md; // 8px
```

## 🔐 Authentication Flow

1. **App Start** → `RootNavigator` checks for active session
2. **No Session** → Show `AuthScreen`
3. **Demo Login** → Create stub session, navigate to app
4. **Authenticated** → Show `AppNavigator` with protected screens
5. **Logout** → Clear session, return to auth

## 📱 Components

All components are reusable, typed, and neutral (no locked-in colors):

```typescript
import {
  Card, // Container primitive
  ListItem, // Row with title, subtitle, action
  Badge, // Status label with variants
  StatusLabel, // Colored status indicator
  Loader, // Activity indicator
  ErrorState, // Error message with retry
  EmptyState, // Empty state with action
} from '@components/index';
```

## 🔍 Type Safety

**100% TypeScript coverage** — Every function, component, and hook is fully typed. Zero `any` types allowed.

## 📊 State Management

Using **Zustand** for simplicity:

```typescript
import { useAuthStore } from '@store/index';

const { session, setSession } = useAuthStore();
// Automatic re-renders on state changes
```

## 📦 Dependencies

**Curated, minimal set:**

- `expo` — Platform
- `react-navigation` — Routing
- `zustand` — State management
- `@react-native-async-storage/async-storage` — Persistence
- `typescript`, `eslint`, `prettier` — Quality

**Zero mock data, zero extra bloat.**

## 🚢 Deployment

```bash
# Build and deploy via Expo
eas build --platform all
eas submit --platform all
```

## 📝 Coding Standards

### Enforced Rules

- ✅ No unused variables or imports
- ✅ No implicit `any` types
- ✅ Full return type annotations
- ✅ No hardcoded copy or branding
- ✅ Proper error handling

### Run CI Pipeline

```bash
pnpm run ci
# Runs: typecheck + lint:check + format:check
```

## 🔮 Phase 3.1 — Visual Strategy

Next phase (design locked):

- [ ] Design system (colors, locked typography)
- [ ] Component design tokens (shadows, animations)
- [ ] Branding (logos, imagery)
- [ ] Interaction design (gestures, transitions)
- [ ] Dark mode variants

**No business logic changes — only visual refinement.**

## 📚 Further Reading

- [React Native](https://reactnative.dev)
- [Expo](https://docs.expo.dev)
- [React Navigation](https://reactnavigation.org)
- [TypeScript](https://www.typescriptlang.org/docs)
- [Zustand](https://github.com/pmndrs/zustand)

---

**Built to scale. Built to last. Built right.**

✓ Phase 3.0 Foundation Complete | Ready for Phase 3.1 Design
