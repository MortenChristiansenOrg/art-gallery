# Design System

## Design Philosophy

### Vision: A Digital Gallery Space

The website evokes the experience of being in a refined physical art gallery. Design decisions serve this metaphor:

- **Warm neutrality** - Walls are warm off-white, not clinical white
- **Generous negative space** - Artworks breathe, not crowded
- **Subtle framing** - Cards mimic matted, framed works
- **Restrained motion** - Animations are slow, deliberate, elegant
- **Typography as curator** - Text guides without competing

### Guiding Principles

1. **Refinement over boldness** - Every element should feel considered
2. **Content primacy** - The art is the focus; UI recedes
3. **Warmth** - Avoid cold grays and harsh contrasts
4. **Motion restraint** - No jarring animations; everything flows

---

## Design Tokens

All tokens are defined as CSS custom properties in `src/index.css` under `@theme`, making them available as Tailwind utilities.

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-gallery-bg` | `#fcfbf9` | Page background (warm off-white) |
| `--color-gallery-surface` | `#ffffff` | Card surfaces, inputs |
| `--color-gallery-text` | `#1c1c1c` | Primary text (soft black) |
| `--color-gallery-accent` | `#2d2d2d` | Secondary emphasis |
| `--color-gallery-muted` | `#6e6e6e` | Secondary text |
| `--color-gallery-subtle` | `#a3a3a3` | Tertiary text, labels |
| `--color-gallery-border` | `#e9e7e3` | Primary borders (warm gray) |
| `--color-gallery-border-light` | `#f0eeea` | Subtle dividers |
| `--color-gallery-hover` | `#f7f5f2` | Hover backgrounds, matting |

**Note:** All grays are warm-tinted to maintain gallery warmth.

### Typography

| Token | Value | Usage |
|-------|-------|-------|
| `--font-serif` | `"Cormorant Garamond", "Garamond", serif` | Headings, titles |
| `--font-sans` | `"Jost", "Futura", sans-serif` | Body, UI elements |

**Font weights loaded:**
- Cormorant Garamond: 300, 400, 500, 600 (+ 400 italic)
- Jost: 300, 400, 500

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| `--spacing-gallery` | `2rem` | Primary spacing unit |

### Transitions

| Token | Value | Usage |
|-------|-------|-------|
| `--transition-elegant` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard easing |
| `--transition-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Reserved for spring effects |

---

## Typography Scale

### Headings (Serif)

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
| Page title (H1) | 2.5-3rem | 300 (light) | 0.01em | About page, etc. |
| Section title (H2) | 1.75rem | 300 (light) | 0.01em | "Get in Touch" |
| Card title (H3) | 1.1rem | 400 (normal) | 0.01em | Artwork names |

### Body & UI (Sans)

| Element | Size | Weight | Tracking | Notes |
|---------|------|--------|----------|-------|
| Body copy | 1rem | 300 | 0.01em | Line-height 1.8 |
| Navigation | 0.8rem | 300 | 0.15em | Uppercase |
| Labels | 0.7rem | 300 | 0.15-0.2em | Uppercase |
| Metadata | 0.75rem | 300 | 0.08em | Year, dimensions |
| Form inputs | 0.95rem | 300 | — | — |

---

## Layout

### Container

- Max width: `max-w-7xl` (~1280px)
- Padding: `px-8` (mobile) / `px-12` (desktop)

### Grid

Artwork grid uses responsive columns:

```
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3
gap-x-8 gap-y-12 lg:gap-x-10 lg:gap-y-16
```

### Key Spacing Values

| Context | Value | Tailwind |
|---------|-------|----------|
| Section padding (vertical) | 64px | `py-16` |
| Card padding (internal) | 12-16px | `p-3 sm:p-4` |
| Card caption margin-top | 20px | `mt-5` |
| Nav item gap | 40px | `gap-10` |
| Header height | 80px | `h-20` |

---

## Components

### Artwork Card (`.gallery-frame`)

Mimics a framed, matted artwork:

```
┌─────────────────────────┐  ← border: gallery-border
│ ┌─────────────────────┐ │  ← padding: p-3/p-4 (white frame)
│ │ ┌─────────────────┐ │ │  ← bg: gallery-hover (matting)
│ │ │                 │ │ │
│ │ │     Image       │ │ │
│ │ │                 │ │ │
│ │ └─────────────────┘ │ │
│ └─────────────────────┘ │
└─────────────────────────┘

Title                        ← Serif, below frame
Year                         ← Muted, small
```

**Shadows:**
- Rest: `0 1px 2px rgba(0,0,0,0.02), 0 4px 8px rgba(0,0,0,0.02)`
- Hover: `0 4px 12px rgba(0,0,0,0.04), 0 12px 32px rgba(0,0,0,0.06)`

**Hover behavior:**
- Frame lifts (`translateY(-4px)`)
- Shadow deepens
- Image scales subtly (`scale-[1.03]`)
- Title color fades to muted

### Links (`.elegant-underline`)

Animated underline reveal:
- Hidden by default (`scaleX(0)`)
- On hover: slides in from left (`scaleX(1)`)
- On leave: slides out to right (via transform-origin switch)

### Buttons (`.btn-elegant`)

- Base: subtle background
- Hover: pseudo-element slides up from bottom
- Transition: 0.3s with elegant easing

### Form Inputs (`.input-elegant`)

- Transparent background with bottom border only
- On focus: border darkens, bg becomes surface white

### Loading State (`.skeleton-shimmer`)

Gradient shimmer animation for loading placeholders.

---

## Animation

### Keyframes

| Name | Effect | Duration |
|------|--------|----------|
| `fadeIn` | Opacity 0→1, translateY 12px→0 | 0.6s |
| `fadeInUp` | Opacity 0→1, translateY 24px→0 | 0.7s |
| `revealLine` | scaleX 0→1 | — |
| `shimmer` | background-position shift | 1.5s loop |

### Stagger System

Cards and elements use staggered entry:

```css
.animate-fade-in.stagger-1 { animation-delay: 0.05s; }
.animate-fade-in.stagger-2 { animation-delay: 0.1s; }
/* ... through stagger-9 at 0.45s */
```

Components cycle through `stagger-${(index % 9) + 1}`.

### Interactive Transitions

| Element | Property | Duration |
|---------|----------|----------|
| Link underlines | transform | 0.4s |
| Card hover | shadow, transform | 0.5s |
| Image scale | transform | 0.7s |
| Form focus | border-color | 0.3s |
| Button hover | background | 0.3s |

---

## Accessibility

### Focus States

All interactive elements use `focus-visible`:
- 1px solid outline in text color
- 4px outline offset

### Color Contrast

- Text (`#1c1c1c`) on background (`#fcfbf9`): ~15:1
- Muted text (`#6e6e6e`) on background: ~5.5:1
- Subtle text (`#a3a3a3`) on background: ~3:1 (decorative only)

### Motion

- `scroll-behavior: smooth` for in-page navigation
- All animations use non-jarring easing curves

---

## Implementation Notes

### Styling Approach

Components use Tailwind utility classes with CSS custom properties:

```tsx
// Preferred pattern
className="bg-[var(--color-gallery-surface)] border-[var(--color-gallery-border)]"
```

### File Organization

- `src/index.css` - All design tokens and utility classes
- Components use inline Tailwind classes referencing tokens
- No separate CSS modules or styled-components

### Adding New Colors

Add to `@theme` block in `src/index.css`:

```css
@theme {
  --color-gallery-newcolor: #hexvalue;
}
```

Then use as `bg-[var(--color-gallery-newcolor)]` or `text-[var(--color-gallery-newcolor)]`.
