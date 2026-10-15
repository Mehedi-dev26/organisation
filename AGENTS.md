# Agent Rules & Workflow Guidelines - Somoyer Batighor (সময়ের বাতিঘর)

## 1. Automatic GitHub Push & Release
- **Mandatory on Task Completion**: Whenever any feature, bug fix, UI update, or refactoring is completed, the agent MUST automatically stage all changes, create a clean descriptive commit message, and push directly to GitHub (`git push origin main` or current branch).
- This triggers the automatic Vercel production deployment without requiring manual intervention from the user.

## 2. Design System & UI/UX Standards
- **Typography**: Bengali fonts `'Hind Siliguri'` and `'Noto Sans Bengali'`, paired with `'Poppins'`.
- **Signature Section Headers**:
  - Top pill badge with soft emerald tint (`#E6F4EA`), border (`#C8E6C9`), green icon (`Sprout` or relevant icon), and bold text.
  - Two-tone heading: primary text in `#14231B`, highlighted keywords in `#0B6B3A` with the signature yellow-green brush stroke SVG underline (`#9BD038`).
  - Organic leaf sparkle accents flanking the heading.
- **Card Aesthetics**:
  - `rounded-[24px]` radius, soft elevation shadows (`shadow-[0_10px_35px_rgba(0,0,0,0.06)]`).
  - Clean, restrained pill buttons with soft pastel tints and matching borders.
  - Smooth interactive transitions (`translateY(-8px)`, scale on hover).
- **Dual Language**: Support both Bangla (`bn` default) and English (`en`) seamlessly.
