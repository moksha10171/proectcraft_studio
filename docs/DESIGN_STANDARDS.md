# Design Standards & UI Consistency Guide

This document outlines the design standards for the ProjectCraft codebase to ensure UI consistency.

## Button Sizes

All buttons must meet the **minimum 44x44px touch target** requirement for mobile accessibility:

- **Small (`sm`)**: `h-11 min-h-[44px]` - For compact spaces
- **Default**: `h-11 min-h-[44px]` - Standard buttons
- **Large (`lg`)**: `h-12 min-h-[44px]` - Primary actions, CTAs
- **Icon buttons**: `size-11 min-h-[44px] min-w-[44px]` - Icon-only buttons

**Note**: The button component (`components/ui/button.tsx`) has been updated to enforce these minimums automatically.

## Border Radius

- **Small (`sm`)**: `rounded-md` (6px) - Inputs, badges, small elements
- **Default**: `rounded-xl` (12px) - Buttons, cards, standard elements
- **Large (`lg`)**: `rounded-2xl` (16px) - Modals, containers, featured cards
- **Full**: `rounded-full` - Pills, avatars, circular elements

## Spacing Scale

### Padding
- **Extra Small**: `px-2 py-1` (8px/4px)
- **Small**: `px-4 py-2` (16px/8px)
- **Default**: `px-6 py-3` (24px/12px)
- **Large**: `px-8 py-4` (32px/16px)
- **Extra Large**: `px-12 py-6` (48px/24px)

### Container Padding
- **Mobile**: `px-4` (16px)
- **Tablet**: `px-6` (24px)
- **Desktop**: `px-8` (32px)
- **Large Desktop**: `px-12` (48px)

### Gap Sizes
- **Extra Small**: `gap-1` (4px)
- **Small**: `gap-2` (8px)
- **Default**: `gap-4` (16px)
- **Large**: `gap-6` (24px)
- **Extra Large**: `gap-8` (32px)

## Typography

- **Headings**: Use semantic HTML (`<h1>`, `<h2>`, etc.) with appropriate sizes
- **Body text**: Default to `text-sm` or `text-base` for readability
- **Small text**: Use `text-xs` (12px minimum) for labels, captions

## Color Usage

Always use CSS variables instead of hardcoded colors:
- `text-primary`, `bg-primary` - Primary actions
- `text-muted-foreground` - Secondary text
- `bg-card`, `border-border` - Cards and containers
- `bg-background` - Page backgrounds

See `app/globals.css` for the complete color system.

## Design Tokens

Use Tailwind utilities and CSS variables from `app/globals.css` when creating new components. Prefer semantic color classes (`bg-background`, `text-foreground`, `border-border`) over hard-coded hex values.

## Accessibility

- All interactive elements must be ≥ 44x44px on mobile
- Use semantic HTML elements
- Include ARIA labels for icon-only buttons
- Ensure sufficient color contrast (WCAG AA minimum)

## Migration Notes

Existing components may use different sizes for historical reasons. When updating components:
1. Prioritize fixing touch target sizes (critical for mobile)
2. Gradually standardize border radius and spacing
3. Use Tailwind/CSS variables from `globals.css` for new components
