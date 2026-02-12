---
description: Frontend component and page rules
globs: "src/components/**/*.tsx,src/app/**/*.tsx,app/**/*.tsx,components/**/*.tsx,pages/**/*.tsx"
---
- Use lucide-react for all icons — no emoji unicode, no other icon libraries
- Follow existing Tailwind CSS patterns and utility classes
- Check for reusable components before creating new ones
- Accessibility required: aria-label, semantic HTML, focus management, 4.5:1 contrast
- Test both light AND dark mode when modifying themed components
- Use CSS variables for theme values, not hardcoded colors
- Lazy load heavy components, memoize expensive renders
- Visual depth: 3-4 color shades, layered shadows for realism
