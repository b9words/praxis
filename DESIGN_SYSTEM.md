# Praxis Design System

## Core Design Principles

**Editorial/Professional Aesthetic** (Inspired by McKinsey/HBR)
- Clean, minimal, clinical layouts
- Light typography with subtle hierarchy
- Neutral color palette (neutral-50 through neutral-900)
- Thin architectural lines (0.5-1px) for structure

## Uniform Width System

**All sections use `max-w-7xl`** for consistent alignment:

- Navigation header: `max-w-7xl`
- All section containers: `max-w-7xl` outer containers
- Footer: `max-w-7xl`
- Content sections (Hero, CTA): Inner `max-w-4xl` wrappers for readability while maintaining outer alignment
- Consistent padding: `px-6 lg:px-8`

## Architectural Line System

**Unified visual language** applied variably across sections:

### Line Variants

1. **Vertical accents**: Full-height left-edge guides
   - Used in: Hero, Method, Curriculum sections
   - Opacity: 30%

2. **Horizontal accents**: Top-edge dividers
   - Used in: Competencies section
   - Opacity: 20%

3. **Edge accents**: Left/right side boundaries
   - Used in: Stats, Social Proof sections
   - Opacity: 20-30%

4. **Corner accents**: Small horizontal lines (12px width)
   - Used in: Hero section
   - Opacity: 20%

5. **Center dividers**: Vertical center lines
   - Used in: CTA section
   - Opacity: 10% (white on dark)

6. **Interactive elements**: Timeline indicators with hover states
   - Used in: Curriculum section
   - Hover transitions: opacity 50% → 100%

7. **Section headers**: Left accent lines on large screens
   - Position: `-left-8 top-0 w-px h-20`
   - Opacity: 20%
   - Visible: `hidden lg:block`

### Line Specifications

- **Width**: 0.5-1px
- **Color**: `bg-neutral-200`, `bg-neutral-900`, or `bg-white/10`
- **Opacity**: 15-40% (varies by context)
- **Transitions**: Smooth hover states where applicable

## Visual Refinements

### Icons

- **Library**: Lucide React icons only
- **Common icons**: `BookOpen`, `Target`, `TrendingUp`, `Users`, `DollarSign`, `Shield`
- **No emojis**: Replace all emojis with appropriate Lucide icons

### Navigation

- **Links**: Animated 0.5px underlines on hover
- **Animation**: `transition-all duration-300`
- **Logo**: Permanent 0.5px underline

### Cards & Components

- **Hover states**: Subtle border color transitions
- **Accent reveals**: Top border lines on hover (0.5px, opacity 0 → 20%)
- **Transitions**: `transition-colors`, `transition-opacity`

### Typography

- **Headings**: Light font weight (`font-light`)
- **Tracking**: Tight (`tracking-tight`)
- **Hierarchy**: Clear size progression (text-3xl, text-xl, text-lg, text-base)
- **Colors**: `text-neutral-900` (primary), `text-neutral-700` (secondary), `text-neutral-600` (tertiary)

### Spacing

- **Section padding**: `py-24` (standard), `py-16` (stats), `py-32` (hero)
- **Grid gaps**: `gap-12` (method), `gap-8` (competencies, testimonials)
- **Internal spacing**: Consistent `space-y-*` utilities

### Background Patterns

- **Diagonal pattern**: Very subtle (opacity 0.015) for CTA section
- **Pattern spec**: 40x40px, 0.5px stroke width
- **Color**: White on dark backgrounds

## Component Patterns

### Section Structure

```tsx
<section className="border-b border-neutral-200 relative">
  <SectionAccent variant="vertical" className="opacity-30" />
  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-24 relative">
    <div className="mb-20 relative">
      <div className="absolute -left-8 top-0 w-px h-20 bg-neutral-900 opacity-20 hidden lg:block"></div>
      <h2 className="text-3xl font-light text-neutral-900 mb-4 tracking-tight">Section Title</h2>
      {/* Content */}
    </div>
  </div>
</section>
```

### Buttons

- **Primary**: `bg-neutral-900 hover:bg-neutral-800 text-white rounded-none`
- **Outline**: `border-neutral-300 hover:border-neutral-400 rounded-none`
- **Size**: `px-8 h-12 text-sm font-medium`

### Cards

- **Base**: `bg-white border border-neutral-200 p-6`
- **Hover**: `hover:border-neutral-300 transition-colors`
- **Accent line**: `absolute top-0 left-0 w-full h-[0.5px] bg-neutral-900 opacity-0 hover:opacity-20`

## Color Palette

```
neutral-50   #fafafa  (background alternates)
neutral-100  #f5f5f5  (subtle backgrounds)
neutral-200  #e5e5e5  (borders, lines)
neutral-300  #d4d4d4  (hover borders)
neutral-400  #a3a3a3  (secondary text)
neutral-500  #737373  (tertiary text)
neutral-600  #525252  (secondary text)
neutral-700  #404040  (body text)
neutral-800  #262626  (hover states)
neutral-900  #171717  (primary text, buttons)
```

## Implementation Checklist

- [x] Landing page (`app/page.tsx`)
- [x] Authentication pages (`app/(auth)/*`) - Login, Signup, Reset Password
- [x] Pricing page (`app/(marketing)/pricing/page.tsx`)
- [x] Footer component (`components/layout/Footer.tsx`)
- [x] Error page (`app/error.tsx`)
- [x] SectionAccent component (`components/layout/SectionAccent.tsx`)

