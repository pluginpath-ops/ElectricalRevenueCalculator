# Energy Revenue Estimator — UI & Design Specification

This document supplements the main build plan. It defines the visual language, color system, component styling, and layout rules for the entire application.

---

## Design Philosophy

**Moderately dense, modern, high-contrast.** This is a data tool, not a marketing site. Users want to see numbers, charts, and controls without excessive whitespace or decorative elements. Think Bloomberg Terminal's information density married to a modern SaaS layout — not as extreme as Bloomberg, but closer to that end of the spectrum than a typical landing page.

Every pixel of contrast matters. If a user can't instantly distinguish text from background, a button from a label, or an active state from a disabled state, the design has failed.

---

## Color System

### Foundation

| Token | Hex | Usage |
|---|---|---|
| `--bg-primary` | `#FFFFFF` | Page background |
| `--bg-surface` | `#F8F9FA` | Cards, panels, sidebar backgrounds |
| `--bg-inset` | `#F1F3F5` | Table headers, input backgrounds, nested containers |
| `--border-default` | `#D1D5DB` | Card borders, dividers, input borders |
| `--border-strong` | `#9CA3AF` | Emphasized borders (active inputs, focused elements) |
| `--text-primary` | `#111827` | All body text, labels, headings — near-black |
| `--text-secondary` | `#4B5563` | Supporting text, descriptions — dark grey, NOT light grey |
| `--text-disabled` | `#9CA3AF` | Disabled inputs, unavailable options ONLY |

### Semantic Button Colors

| Role | Background | Text | Hover | Usage |
|---|---|---|---|---|
| **Action (Blue)** | `#2563EB` | `#FFFFFF` | `#1D4ED8` | Primary actions: "Import", "Calculate", "Export CSV", "Save Scenario", "Load Example" |
| **Go (Green)** | `#16A34A` | `#FFFFFF` | `#15803D` | Confirmations: "Confirm Mapping", "Apply", start/enable actions |
| **Danger (Red)** | `#DC2626` | `#FFFFFF` | `#B91C1C` | Destructive: "Delete Scenario", "Clear Data", "Reset" |
| **Neutral (Grey)** | `#E5E7EB` | `#374151` | `#D1D5DB` | Secondary/de-emphasized: "Cancel", "Close", collapsed detail toggles, "Show Advanced" |
| **Disabled** | `#F3F4F6` | `#9CA3AF` | none | Buttons that cannot be clicked. Must look obviously inert — no pointer cursor. |

**Rules:**
- Never use colored text on colored backgrounds (e.g., no blue text on a blue-tinted card).
- Button text is always white on saturated backgrounds, always dark on grey/neutral backgrounds.
- Do not invent additional button colors. If a button doesn't fit these four categories, use Blue (action).

### Data Visualization Palette

Charts need their own distinct, non-overlapping palette that avoids the semantic button colors:

| Series | Hex | Usage |
|---|---|---|
| Generation | `#F59E0B` (amber) | Solar/generation data in all charts |
| Energy Price | `#8B5CF6` (violet) | Energy price lines and bars |
| Capacity Price | `#A78BFA` (lighter violet) | Capacity price (when shown separately) |
| Solar Revenue | `#F59E0B` (amber) | Revenue from generation |
| Battery Revenue | `#06B6D4` (cyan) | Revenue from battery |
| Battery SOC | `#06B6D4` (cyan) | State of charge line |
| Charge | `#10B981` (emerald) | Battery charging indicators |
| Discharge | `#EF4444` (red-500) | Battery discharging indicators |
| Consumption | `#6B7280` (grey-500) | Consumption profile overlay |

**Heatmap color scales:**
- Price/revenue (diverging): `#2563EB` (negative/blue) → `#F8F9FA` (zero/near-white) → `#DC2626` (positive/red)
- Generation (sequential): `#FEF3C7` (low/pale amber) → `#F59E0B` (mid/amber) → `#B45309` (high/dark amber)
- SOC (sequential): `#ECFDF5` (low/pale green) → `#06B6D4` (full/cyan)

---

## Typography

Use the system font stack — no custom font loading:

```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
```

| Element | Size | Weight | Color |
|---|---|---|---|
| Page title (H1) | 24px | 700 | `--text-primary` |
| Section heading (H2) | 18px | 600 | `--text-primary` |
| Card heading (H3) | 15px | 600 | `--text-primary` |
| Body text | 14px | 400 | `--text-primary` |
| Supporting text | 13px | 400 | `--text-secondary` |
| Table cell text | 13px | 400 | `--text-primary` |
| Table header text | 12px | 600 | `--text-primary`, uppercase, letter-spacing 0.5px |
| Input labels | 13px | 500 | `--text-primary` |
| Metric values (summary cards) | 28px | 700 | `--text-primary` |
| Metric labels (summary cards) | 12px | 500 | `--text-secondary` |
| Tooltip content | 13px | 400 | `#FFFFFF` on `#1F2937` background |

**Rules:**
- Never use grey lighter than `#4B5563` for text that users need to read. Grey text is reserved for truly disabled/unavailable elements.
- Never use font-weight below 400.
- Headings use `--text-primary` (near-black). No colored headings.

---

## Unicode Icons (No Emoji)

Do not use emoji anywhere in the UI. Use Unicode symbols and HTML entities for iconography:

| Purpose | Symbol | Unicode / Entity |
|---|---|---|
| Close / Delete | ✕ | `U+2715` |
| Confirm / Success | ✓ | `U+2713` |
| Warning | ⚠ | `U+26A0` |
| Info | ⓘ | `U+24D8` |
| Expand / Collapse down | ▾ | `U+25BE` |
| Expand / Collapse right | ▸ | `U+25B8` |
| Arrow right (navigation) | → | `U+2192` |
| Arrow left (back) | ← | `U+2190` |
| Arrow up | ↑ | `U+2191` |
| Arrow down | ↓ | `U+2193` |
| Sort ascending | ▲ | `U+25B2` |
| Sort descending | ▼ | `U+25BC` |
| Download / Export | ↓ | `U+2193` (with underline via CSS for "tray" effect) |
| Drag handle | ⠿ | `U+283F` (braille pattern, 6-dot grid) |
| Fullscreen | ⛶ | `U+26F6` or use `⤢` `U+2922` |
| External link | ↗ | `U+2197` |
| Add / New | + | `U+002B` |
| Remove from list | − | `U+2212` (minus sign, not hyphen) |
| Refresh / Recalculate | ↻ | `U+21BB` |
| Settings / Configure | ⚙ | `U+2699` |
| Battery (in headers) | ⚡ | `U+26A1` (acceptable — this is a standard symbol, not an emoji face) |
| Search | ⌕ | `U+2315` or just use a magnifying glass SVG |

For any icon need not covered above, prefer Lucide icons (already available via lucide-react) over emoji. Lucide icons render as clean SVG line art and match the high-contrast aesthetic.

**Rules:**
- Symbols in buttons should be paired with text labels: `✕ Delete`, `↓ Export CSV`, `+ Add Scenario`. Icon-only buttons are allowed only for compact toolbar actions (fullscreen, close modal) where the meaning is unambiguous.
- Symbol color matches the button text color — do not independently color icons.

---

## Layout Structure

### Overall Page Layout

```
┌─────────────────────────────────────────────────────────┐
│  Header: "Energy Revenue Estimator" + brief subtitle    │
├──────────┬──────────────────────────────────────────────┤
│          │                                              │
│  Step    │  Main Content Area                           │
│  Nav     │                                              │
│  (left   │  (scrollable, full remaining width)          │
│  sidebar │                                              │
│  ~200px) │                                              │
│          │                                              │
├──────────┴──────────────────────────────────────────────┤
│  Footer: GitHub link, version                           │
└─────────────────────────────────────────────────────────┘
```

- Left sidebar: fixed-position step navigation (Import → Configure → Results). Steps show completion state: a ✓ for completed steps, current step highlighted with a left border accent (blue). Future steps are not greyed out — they're clickable but show a subtle "no data yet" state in the main content if prerequisites are missing.
- Main content: scrollable, fills remaining width. Max-width of 1400px, centered, with 24px horizontal padding.
- At tablet widths (<1024px): sidebar collapses to a horizontal step bar at the top.
- At phone widths (<640px): single column, step bar becomes a dropdown.

### Spacing & Density

| Spacing token | Value | Usage |
|---|---|---|
| `--space-xs` | 4px | Inside compact elements (between icon and label in a button) |
| `--space-sm` | 8px | Between related elements (label and input, items in a tight group) |
| `--space-md` | 16px | Card internal padding, gap between form fields |
| `--space-lg` | 24px | Between cards/sections on the page |
| `--space-xl` | 32px | Between major page sections |

**Density target:** A 1080p screen should show the full summary cards + at least one chart without scrolling on the Results tab. Forms on the Configure tab should not require scrolling to see all battery inputs.

---

## Component Styling

### Cards

```
Background: --bg-surface (#F8F9FA)
Border: 1px solid --border-default (#D1D5DB)
Border-radius: 8px
Padding: --space-md (16px)
Shadow: none (borders provide sufficient definition at high contrast)
```

Cards do not have drop shadows. The border and slight background tint provide enough visual separation without the "floating" look that reduces density.

### Inputs (text, number, select)

```
Background: #FFFFFF
Border: 1px solid --border-default (#D1D5DB)
Border-radius: 6px
Padding: 8px 12px
Font-size: 14px
Color: --text-primary (#111827)

Focus state:
  Border: 2px solid #2563EB (blue)
  Outline: none
  Box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15)
```

- Labels are always above the input, never inside (no floating labels).
- Labels are `--text-primary`, 13px, font-weight 500.
- Placeholder text: `#9CA3AF` — the only acceptable light grey text.

### Sliders

```
Track: 4px height, --bg-inset (#F1F3F5) background, rounded
Filled portion: #2563EB (blue)
Thumb: 18px circle, white fill, 2px solid #2563EB border
```

- Always paired with a numeric input showing the exact value.
- Numeric input is to the right of the slider on the same row.

### Toggles

```
Off state: 
  Track: #D1D5DB background, 40px × 22px, rounded-full
  Thumb: white circle, 18px

On state:
  Track: #2563EB background
  Thumb: white circle, shifted right
```

- Label is to the left of the toggle.
- Current state text ("On" / "Off" or "Enabled" / "Disabled") is to the right of the toggle in `--text-secondary`.

### Tables

```
Header row:
  Background: --bg-inset (#F1F3F5)
  Text: --text-primary, 12px, uppercase, 600 weight
  Border-bottom: 2px solid --border-default

Body rows:
  Background: alternating #FFFFFF and #FAFBFC (very subtle stripe)
  Text: --text-primary, 13px
  Border-bottom: 1px solid #F1F3F5

Hover row:
  Background: #EFF6FF (very light blue tint)
```

- Numbers are right-aligned. Text is left-aligned.
- Currency values: format as `$1,234.56` with commas. Negative values in red (`#DC2626`), no parentheses — use a minus sign.
- kWh/MWh values: one decimal place. Prices: two decimal places.

### Tabs (within Results section, for chart selection)

```
Inactive tab:
  Text: --text-secondary, 14px, 500 weight
  Border-bottom: 2px solid transparent
  Padding-bottom: 8px

Active tab:
  Text: --text-primary, 14px, 600 weight
  Border-bottom: 2px solid #2563EB

Hover (inactive):
  Text: --text-primary
  Border-bottom: 2px solid #D1D5DB
```

Tabs are horizontal, flush with the card top edge. No background color changes — just the bottom border indicator.

### Summary Metric Cards

```
┌──────────────────┐
│ SOLAR REVENUE  ⓘ │  ← 12px uppercase label + info icon
│                  │
│  $127,450.23     │  ← 28px bold value
│  ↑ 12% vs avg   │  ← 13px supporting context (optional)
└──────────────────┘

Background: --bg-surface
Border: 1px solid --border-default
Border-radius: 8px
Padding: 16px
Min-width: 180px
```

- Arrange in a responsive grid: 4-5 columns on desktop, 2-3 on tablet, 1-2 on phone.
- The metric value is always `--text-primary` — never colored. Color is reserved for positive/negative change indicators if shown.

### Tooltips

```
Background: #1F2937 (near-black)
Text: #FFFFFF, 13px
Border-radius: 6px
Padding: 8px 12px
Max-width: 280px
Arrow: 6px triangle pointing toward trigger
```

Triggered by hovering over ⓘ icons. Contain 1-3 sentences explaining jargon. No links, no formatting inside tooltips — plain text only.

### Modals (Column Mapper)

```
Overlay: rgba(0, 0, 0, 0.5)
Modal:
  Background: #FFFFFF
  Border-radius: 12px
  Padding: 24px
  Max-width: 720px
  Max-height: 80vh (scrollable content)
  Shadow: 0 20px 60px rgba(0, 0, 0, 0.15)

Header: H2 heading + ✕ close button (top right)
Footer: Action buttons right-aligned (Cancel grey, Confirm green)
```

### Drag-Drop Upload Zone

```
Default:
  Border: 2px dashed #D1D5DB
  Background: #FAFBFC
  Border-radius: 8px
  Padding: 32px
  Text: "Drop CSV file here or click to browse" — --text-secondary, 14px
  Icon: ↑ upload arrow, 24px, --text-secondary

Hover / Drag-over:
  Border: 2px dashed #2563EB
  Background: #EFF6FF
  Text color: #2563EB

Success (file loaded):
  Border: 2px solid #16A34A
  Background: #F0FDF4
  Text: filename + ✓ + file size — --text-primary
  "Change file" link in blue
```

### Warning / Validation Messages

```
Warning:
  Background: #FFFBEB
  Border-left: 4px solid #F59E0B
  Text: --text-primary
  Icon: ⚠ in #F59E0B
  Padding: 12px 16px

Error:
  Background: #FEF2F2
  Border-left: 4px solid #DC2626
  Text: --text-primary
  Icon: ✕ in #DC2626

Success:
  Background: #F0FDF4
  Border-left: 4px solid #16A34A
  Text: --text-primary
  Icon: ✓ in #16A34A
```

These are inline banners, not toasts. They appear directly below the element that triggered them.

---

## Chart Styling

### General Chart Rules

- Background: white (`#FFFFFF`), no grey chart backgrounds.
- Grid lines: `#F1F3F5` (very light, just enough to track values). Horizontal grid lines only — no vertical grid lines except on heatmaps.
- Axis labels: `--text-secondary`, 12px.
- Axis titles: `--text-primary`, 13px, 500 weight.
- Legend: positioned top-right of chart, horizontal layout, 13px text, small colored square (not circle) before each label.
- Tooltip on hover: white background, 1px border `#D1D5DB`, 8px border-radius, compact layout showing series name + value.

### Chart Container (ChartWrapper)

```
┌──────────────────────────────────────────────────────────┐
│  Chart Title                    [variable ▾]  [⛶] [↓]  │
│  ─────────────────────────────────────────────────────── │
│                                                          │
│                   (chart content)                         │
│                                                          │
│                                                          │
└──────────────────────────────────────────────────────────┘

Title: H3 style (15px, 600)
Toolbar: right-aligned, icon buttons with subtle grey background on hover
Variable dropdown: styled as a compact select, not a full dropdown
[⛶] = fullscreen toggle
[↓] = download PNG
```

Chart containers have the same card styling (bg-surface, border, border-radius) as other cards.

### Heatmap Specific

- Cell size: calculated to fill available width. Minimum 2px per day column, 8px per hour row.
- No gaps between cells.
- X-axis: show month labels (Jan, Feb, ...) at approximate positions, not all 365 day numbers.
- Y-axis: show every 3rd hour label (0, 3, 6, 9, 12, 15, 18, 21).
- Color scale legend: horizontal bar below the chart showing the gradient with min/max values.
- Hover: highlight the cell with a 1px white border, show tooltip with date + hour + value.
- Click: highlight the entire column (day) with a semi-transparent overlay, update LineByDay chart.

---

## Responsive Breakpoints

| Breakpoint | Layout changes |
|---|---|
| ≥1280px (xl) | Full layout: sidebar + wide content. Summary cards in 5 columns. Charts at full width. |
| 1024–1279px (lg) | Sidebar narrows to icon-only with tooltips. Summary cards in 4 columns. |
| 768–1023px (md) | Sidebar becomes horizontal top bar. Summary cards in 3 columns. Charts stack vertically. |
| <768px (sm) | Step navigation becomes a dropdown. Summary cards in 2 columns. Tables scroll horizontally. Heatmap gets horizontal scroll. Battery config inputs stack single-column. |

---

## Interaction Patterns

### Loading States

During recalculation (after config change):
- Charts show a subtle pulsing opacity animation (0.5 → 1.0, 300ms cycle) while recalculating.
- Summary cards show the previous value with a small ↻ spinner beside it.
- Do NOT blank out content during recalculation — always show stale data until new data is ready.

### Empty States

When no data has been uploaded yet:
- Results tab shows a centered message: "Upload generation and price data to see results. → Go to Import" with the arrow as a text link (blue).
- Charts show an empty container with a dashed border and the text "No data yet."
- No skeleton loaders — just clear, static messages.

### Error States

- If a file fails to parse: red error banner below the upload zone with the error message. Upload zone remains interactive for retry.
- If engine calculation fails: red error banner at top of Results tab. Previous results remain visible (if any).
- Never show a blank screen on error. Always show the last valid state plus the error message.

---

## Accessibility Notes

- All interactive elements must be keyboard-accessible (tab order, enter/space to activate).
- Focus indicators: 2px blue outline with 3px offset (visible on all backgrounds).
- Color is never the only indicator of state — pair with text labels or icons.
- Chart data should have an "accessible table" toggle that shows the raw data in a table below the chart for screen reader users.
- Minimum contrast ratio: 4.5:1 for all text (the palette defined above meets this).
