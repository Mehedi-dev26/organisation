# Gemini Rules & Guidelines - Somoyer Batighor (সময়ের বাতিঘর)

## 1. Automatic GitHub Push
- After finishing any request, feature implementation, or bugfix, immediately stage all changed files, commit with a professional descriptive message, and execute `git push` so Vercel can automatically build and deploy the update.

## 2. UI Quality & Design System
- Maintain the signature Deep Green (`#0B6B3A`) and Gold theme.
- All section headings should match the signature two-tone style with yellow-green brush-stroke SVG underline and organic leaf sparkle accents.
- Reusable components must be responsive across all devices (Desktop, Tablet, Mobile).

## 3. White Screen Prevention Rules
- Always keep `<ErrorBoundary>` wrapping `<App />` in `main.tsx`.
- Never use components in JSX (e.g., `Navigate`, `Link`, icons) without importing them in the file.
- Always verify build and run type check prior to push.
