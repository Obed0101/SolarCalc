---
description: General project rules - applies to all files
globs: "**/*"
---
- Use TypeScript strict mode for all .ts/.tsx files
- Use Bun as default runtime (fallback to Node.js only if needed)
- Never use console.log in production code — use evlog for structured logging
- Follow existing patterns in the codebase before creating new ones
- Search for similar logic before writing new code
- No TODOs, placeholders, or incomplete code
- Update .agents/global/runtime.json mode field on every response
