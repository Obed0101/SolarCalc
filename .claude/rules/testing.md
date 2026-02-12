---
description: Testing file rules
globs: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx,__tests__/**/*"
---
- Cover critical paths and edge cases
- Use descriptive test names that explain the scenario
- No mock data passed off as real data
- Test error states and boundary conditions
- Keep tests independent — no shared mutable state between tests
- Prefer integration tests for API endpoints, unit tests for utilities
