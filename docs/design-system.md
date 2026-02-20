# VocaNote Design System

> **Aesthetic Goal:** Warm, tactile, and inviting. The interface should feel like a well-loved personal notebook with subtle paper textures, hand-drawn elements, and a cozy coffee-shop atmosphere.

## 1. Core Design Tokens

### Color Palette (Warm Coffee & Soft Orange)

These semantic color names should be used throughout the application to maintain consistency.

| Token | Hex | Use Case |
| :--- | :--- | :--- |
| **Backgrounds** | | |
| `bg-primary` | `#FDFCF8` | Main application background (Warm White) |
| `bg-sidebar` | `#FAF9F6` | Sidebar / Secondary navigations |
| `bg-paper` | `#FFFFFF` | Notebook pages, cards |
| `bg-accent-soft`| `#FFF3E0` | Hover states, light highlights |
| `bg-yellow-note`| `#FFFDE7` | Sticky notes / Tips |
| **Text** | | |
| `text-primary` | `#4E342E` | Body text (Dark Coffee) |
| `text-secondary`| `#8D6E63` | Subtitles, metadata (Medium Coffee) |
| `text-light` | `#BCAAA4` | Placeholders, disabled text (Light Coffee) |
| **Interactive** | | |
| `accent-primary`| `#E65100` | Primary buttons, active states (Deep Orange) |
| `accent-hover` | `#BF360C` | Hover states for primary actions |
| **Utility** | | |
| `border-line` | `#EFEBE9` | Subtle dividers, input borders |
| `line-notebook` | `rgba(62, 39, 35, 0.04)` | Horizontal notebook lines |
| `margin-notebook`| `rgba(239, 83, 80, 0.06)` | Vertical margin line (red) |

### Typography

We use a "Formal vs. Hand-drawn" pairing strategy.

*   **Primary (UI / Content)**:
    *   English: `'Lora', serif`
    *   Korean: `'Noto Sans KR', sans-serif`
*   **Handwritten (Accents / Notes / Metadata)**:
    *   English: `'Patrick Hand', cursive`
    *   Korean: `'Gowun Dodum', cursive`

### Shadows & Elevation

*   **Soft Float**: `0 4px 20px rgba(62, 39, 35, 0.04)` (Cards, Paper)
*   **Sharp Card**: `0 2px 8px rgba(62, 39, 35, 0.03)` (Small widgets)
*   **Active Lift**: `0 8px 16px rgba(62, 39, 35, 0.1)` (Hover states)

---

## 2. Textures & Backgrounds

### Global Dot Pattern
Used on the main body background to add texture without noise.

```css
background-image: radial-gradient(#D7CCC8 1px, transparent 1px);
background-size: 24px 24px;
```

### Notebook Paper Effect (Complex Gradient)
The core "lined paper" look. This CSS creates horizontal blue-ish lines and a vertical red margin line.
**Note:** `background-attachment: local` ensures lines scroll with content.

```css
.paper-sheet {
  background-color: #fff;
  background-image:
    /* Vertical Margin Line */
    linear-gradient(90deg, transparent 59px, var(--margin-notebook) 59px, var(--margin-notebook) 60px, transparent 60px),
    /* Horizontal Item Lines */
    linear-gradient(var(--line-notebook) 1px, transparent 1px);
    
  background-size: 100% 100%, 100% 48px; /* 48px = Row Height */
  background-attachment: local;
  background-position: 0 40px; /* Offset to start lines after header */
}
```

---

## 3. UI Components

### Buttons
Buttons should feel tactile. Primary buttons are solid; Secondary buttons are outlined.

*   **Primary**: `bg-primary`, `text-white`, `rounded-md`
    *   *Hover*: Translate Y -1px, darken background.
*   **Outline**: Transparent bg, `border-line`, `text-secondary`.
    *   *Hover*: Border becomes `text-secondary`, text becomes `text-primary`.
*   **Action Card**: Large, clickable areas (e.g., choice selection). See `.action-btn` in drafts.
*   **FAB (Floating Action Button)**: Round, fixed position (bottom-right), `shadow-float`.
    *   Use `bg-primary` (dark) or `accent-primary`.
    *   *Hover*: Scale 1.1x.

### Tags & Badges
Small inline indicators.
*   **Style**: Rounded-full (pill shape), `border-1`, `bg-white`.
*   **Font**: Hand-drawn font family.
*   **Highlight**: `bg-accent-soft`, `text-accent-primary`, `border-accent-light`.

### Inputs
Clean, minimal inputs that sit comfortably on the "paper".
*   **Standard**: White bg, `border-line`, `rounded-md`.
*   **Underline (Quiz Mode)**: Transparent bg, bottom border only (`2px solid text-primary`).
    *   Large font size, centered text.
*   **Focus**: Border color changes to `accent-primary`.
*   **Search**: Include icon on left, ample padding.

### Sticky Note ("Question Box")
Used for prompts, tips, or quiz questions.
*   **Background**: `#FFFDE7` (Yellow Note)
*   **Border**: `#FFF59D`
*   **Font**: Hand-drawn font.
*   **Effect**: `transform: rotate(-1deg)` (Slight tilt for realism).
*   **Effect**: `transform: rotate(-1deg)` (Slight tilt for realism).
*   **Pin**: Optional pseudo-element circle at top center.

### Progress Bar
*   **Container**: `bg-border-line`, `rounded-full`, height `6px`.
*   **Fill**: `bg-accent-primary`, rounded.

### Handwritten Decorations
Use for "Don't forget!" or margin notes.
*   **Font**: Hand-drawn font.
*   **Style**: `transform: rotate(-3deg)`, opaque (0.6 opacity), `text-secondary`.

---

## 4. Layout Patterns

*   **Sidebar**: Fixed width (`260px`), `bg-sidebar`, right border.
*   **Main Content**: Flex column, `overflow-hidden`.
*   **Dashboard Area**: Central scrollable area containing the `.paper-sheet`.
*   **Header**: Glassmorphism effect (`backdrop-filter: blur(8px)`), sticky top.
