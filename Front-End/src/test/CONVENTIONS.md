# Test Writing Conventions — Front-End

## Stack (already set up — DO NOT install anything new)
- **Vitest 4** (`vitest`) + `@vitest/ui`
- **RTL**: `@testing-library/react` (16.x, for React 19), `@testing-library/jest-dom`, `@testing-library/user-event`
- **DOM**: `jsdom`
- Config: `Front-End/vitest.config.ts`
- Global setup: `Front-End/src/test/setup.ts` — mocks `matchMedia`, `ResizeObserver`, `IntersectionObserver`, `URL.createObjectURL/revokeObjectURL`, runs `cleanup()` after each test, imports jest-dom matchers.

## Project stack
- React 19, TypeScript strict (`erasableSyntaxOnly: true`)
- TanStack Router (`@tanstack/react-router` — NOT react-router-dom for new code; LoginPage uses react-router-dom legacy)
- TanStack Query v5 (`@tanstack/react-query`)
- Tailwind CSS v4 (inline styles for hover/focus colors via JS event handlers)
- API DTOs are camelCase (backend uses global `JsonNamingPolicy.CamelCase`)

## File naming + location
- Colocate tests with the source: `foo.ts` → `foo.test.ts`, `Foo.tsx` → `Foo.test.tsx`
- **NEVER** create a `__tests__/` subfolder — keep test files in the same folder as the source
- Files included by config: `src/**/*.{test,spec}.{ts,tsx}`

## Imports
Always use explicit imports from `'vitest'` (don't rely on globals even though they're enabled):

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
```

## Common patterns

### Pure functions
```ts
import { describe, it, expect } from 'vitest'
import { myFn } from './myModule'

describe('myFn', () => {
  it('returns X for input Y', () => {
    expect(myFn('Y')).toBe('X')
  })
})
```

### React components needing QueryClient
```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'

function renderWithQuery(ui: ReactNode) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>)
}
```

### React components needing TanStack Router navigate
Mock the router module:
```ts
vi.mock('@tanstack/react-router', async () => {
  const actual = await vi.importActual<typeof import('@tanstack/react-router')>('@tanstack/react-router')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useParams: () => ({}),
    useSearch: () => ({}),
    Link: ({ children, ...rest }: { children: ReactNode }) => <a {...rest}>{children}</a>,
  }
})
```

### Mocking fetch (for API client tests)
```ts
beforeEach(() => {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'content-type': 'application/json' } })
  )
})
afterEach(() => vi.restoreAllMocks())
```

### Hooks
```ts
import { renderHook, act } from '@testing-library/react'
const { result, rerender, unmount } = renderHook(() => useMyHook(...))
```

## Running tests
From `Front-End/`:
```
npm test                          # run all
npm test -- src/path/to/file      # run one file
npm test -- --watch               # watch mode
```

When invoking from outside the folder:
```
npm --prefix Front-End test -- <path>
```

## DON'T
- Don't add MSW, Cypress, Playwright, Jest, or any new deps
- Don't create `__tests__/` folders
- Don't import `'@testing-library/jest-dom'` in each file — setup.ts does it once
- Don't use `act` warnings as a passing signal — verify with `screen.getBy*` assertions
- Don't test implementation details (private state) — test rendered output and behavior
- Don't catch errors in tests just to silence them — let failures fail loudly

## DO
- Test the public behavior: what the function returns, what the user sees on the screen, what is called with what arguments
- One `describe` per module, multiple `it` blocks per behavior
- Use `userEvent` (not `fireEvent`) for interactions
- Verify with assertions, not console logs
- Run the suite after writing — fix until green
