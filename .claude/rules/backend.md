---
description: Backend API and server-side rules
globs: "src/api/**/*,convex/**/*,server/**/*,api/**/*,lib/server/**/*"
---
- Use Zod for all input validation
- Structured logging with evlog — never console.log
- Never expose secrets or API keys in responses
- Typed errors with consistent HTTP status codes
- Rate limiting on all public-facing endpoints
- Auth checks: use requireAuth/requireUser patterns for protected routes
- Validate all user inputs at system boundaries
