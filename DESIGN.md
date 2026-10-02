# Design System Inspired by Collectif Mongulu

## 1. Visual Theme & Atmosphere

The Collectif Mongulu design system embodies a warm, inclusive, and purposeful aesthetic centered on community empowerment and social impact. Drawing inspiration from organic, nature-forward principles—reflected in the leaf-adorned logo—the design conveys accessibility, trust, and collaborative spirit. The palette balances soft, calming earth tones with energetic green accents that symbolize growth and sustainability. Typography choices favor elegant serif headers paired with clean, modern grotesque body text, creating a sophisticated yet approachable voice. The overall impression is one of a forward-thinking organization grounded in cultural values and real-world community needs.

**Key Characteristics**
- Warm, inviting color palette with nature-inspired greens and neutral grounds
- Sophisticated serif-sans serif typographic pairing for hierarchy and clarity
- Generous whitespace and breathing room reflecting thoughtful, deliberate design
- Soft, accessible interactive elements with rounded affordances
- Emphasis on human-centered imagery and storytelling
- Light, minimal elevation—no heavy shadows; clarity through contrast instead

## 2. Color Palette & Roles

### Primary
- **Forest Green** (`#576F1F`): Primary call-to-action buttons, links, and active navigation states; represents growth and community engagement. Darkened from `#6B8E23` to meet WCAG AA contrast (≥ 4.5 on white and cream), enforced by automated a11y tests
- **Deep Olive** (`#556B2F`): Secondary emphasis and heading text; conveys stability and grounding
- **Sage Green** (`#9ACD32`): Accent highlights, badges, and secondary interactive states; softer, supporting role

### Accent Colors
- **Warm Tan** (`#D4B896`): Soft background tints and hover states; creates warmth and approachability
- **Light Cream** (`#F5F1E8`): Page backgrounds and hero sections; neutral canvas for content
- **Muted Beige** (`#E8E4D8`): Secondary background fills and card surfaces

### Interactive
- **Sage Glass** (`#E6F0D6`): Button hover states and light interactive backgrounds; semi-transparent sage overlay
- **Subtle Green Tint** (`#C8DBA8`): Navigation pill backgrounds and secondary action zones
- **Dark Charcoal** (`#47483B`): Links in default state and supporting text

### Neutral Scale
- **Dark Text** (`#1F1F1F`): Primary body copy and main heading text; high contrast for readability
- **Mid Gray** (`#6B6B6B`): Secondary text, metadata, and supporting information
- **Light Gray** (`#A9A9A9`): Tertiary text and disabled states
- **White** (`#FFFFFF`): Card backgrounds and inverse text contexts

### Surface & Borders
- **Soft Border** (`#D9D9D9`): Card borders and subtle dividers; low-contrast structural lines. Le token Nuxt UI `--ui-border` vaut `#949494`; les séparateurs CSS du site restent à `#E0DDD4`
- **Card Background** (`#FAFAF8`): Default card surface; near-white with slight warmth
- **Section Divider** (`#E0DDD4`): Horizontal rules and subtle content separation

## 3. Typography Rules

### Font Family
- **Primary (Headlines):** Alegreya, Georgia, serif — elegant, distinctive serif font for display hierarchy
- **Secondary (Body & UI):** Hanken Grotesk, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif — modern, clean grotesque for interface text

### Hierarchy

| Role | Font | Size | Weight | Line Height | Letter Spacing | Notes |
|------|------|------|--------|-------------|-----------------|-------|
| **Display/H1** | Alegreya | `62px` | 700 | `60px` | `0px` | Hero titles, main page heading |
| **Heading/H2** | Alegreya | `45px` | 700 | `46px` | `0px` | Section headings, prominent subsections |
| **Subheading/H3** | Alegreya | `22px` | 700 | `25px` | `0px` | Card titles, medium-level headings |
| **Body Text** | Hanken Grotesk | `16px` | 400 | `26px` | `0px` | Default paragraph text, descriptions |
| **Body Semibold** | Hanken Grotesk | `16px` | 600 | `26px` | `0px` | Emphasized body text, list items |
| **Button Label** | Hanken Grotesk | `16px` | 600 | `27px` | `0px` | Interactive button text |
| **Small Text / Caption** | Hanken Grotesk | `13px` | 400 | `20px` | `0px` | Metadata, labels, fine print |
| **Link** | Hanken Grotesk | `16px` | 400 | `26px` | `0px` | Inline links, navigation text |

### Principles
- **Serif for Authority:** Alegreya displays convey editorial credibility and cultural sophistication
- **Sans for Clarity:** Hanken Grotesk body and UI elements ensure modern readability and interface scannability
- **Generous Line Height:** Across all sizes, line height provides breathing room and accessibility for mixed-language content
- **Consistent Weight Hierarchy:** 700-weight serifs contrast with 400/600-weight sans-serif to create visual rhythm
- **No All-Caps:** Prefer title case for headings to maintain approachability and readability in French context

## 4. Component Stylings

### Buttons

#### Primary Button
- **Background:** `#576F1F` (Forest Green)
- **Text Color:** `#FFFFFF` (White)
- **Padding:** `12px 32px`
- **Border Radius:** `999px` (full pill)
- **Border:** `0px none`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 600
- **Line Height:** `27px`
- **Hover State:** Background `#556B2F` (Deep Olive), shadow none
- **Active State:** Background `#3D4D1A`, text remains white
- **Disabled State:** Background `#A9A9A9`, text `#6B6B6B`, cursor not-allowed

#### Secondary Button
- **Background:** `rgba(0, 0, 0, 0)` (Transparent)
- **Text Color:** `#6B6B6B` (Mid Gray)
- **Padding:** `12px 32px`
- **Border Radius:** `999px` (full pill)
- **Border:** `1px solid #D9D9D9`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 600
- **Line Height:** `27px`
- **Hover State:** Background `#F5F1E8` (Light Cream), border remains `#D9D9D9`
- **Active State:** Background `#E8E4D8` (Muted Beige), text `#1F1F1F`

#### Ghost Button
- **Background:** `rgba(0, 0, 0, 0)` (Transparent)
- **Text Color:** `#576F1F` (Forest Green)
- **Padding:** `12px 32px`
- **Border Radius:** `999px`
- **Border:** `1px solid #576F1F`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 600
- **Hover State:** Background `#E6F0D6` (Sage Glass), border remains forest green
- **Active State:** Background `#D0E5B8`, text `#3D4D1A`

### Cards & Containers

#### Standard Card
- **Background:** `#FFFFFF` (White)
- **Text Color:** `#1F1F1F` (Dark Text)
- **Padding:** `16px`
- **Border Radius:** `16px`
- **Border:** `1px solid #D9D9D9`
- **Box Shadow:** `none`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 400
- **Line Height:** `27px`
- **Hover State:** Border color shifts to `#C8DBA8`, subtle scale `1.02`

#### Hero Card (Full Width)
- **Background:** `#F5F1E8` (Light Cream)
- **Text Color:** `#1F1F1F`
- **Padding:** `52px 52px`
- **Border Radius:** `16px`
- **Border:** `1px solid #E0DDD4` (subtle)
- **Box Shadow:** `none`
- **Font Size:** `16px`

#### Image Card
- **Background:** `#FFFFFF`
- **Image Border Radius:** `12px`
- **Padding Around Image:** `4px` gap to card edge
- **Card Padding:** `16px`
- **Border Radius (Card):** `16px`
- **Border:** `1px solid #D9D9D9`

### Inputs & Forms

#### Text Input
- **Background:** `#FFFFFF`
- **Text Color:** `#1F1F1F`
- **Border:** `1px solid #949494` (contraste ≥ 3:1 sur fond blanc, WCAG 1.4.11)
- **Border Radius:** `8px`
- **Padding:** `12px 16px`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 400
- **Line Height:** `26px`
- **Focus State:** Border color `#576F1F`, box-shadow `0 0 0 3px rgba(87, 111, 31, 0.1)`
- **Placeholder Color:** `#767676` (contraste ≥ 4.5:1 sur fond blanc)

#### Textarea
- **Background:** `#FFFFFF`
- **Text Color:** `#1F1F1F`
- **Border:** `1px solid #949494` (contraste ≥ 3:1 sur fond blanc, WCAG 1.4.11)
- **Border Radius:** `8px`
- **Padding:** `12px 16px`
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Min Height:** `120px`
- **Resize:** vertical
- **Focus State:** Border `#576F1F`, shadow `0 0 0 3px rgba(87, 111, 31, 0.1)`

#### Form Label
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 600
- **Color:** `#1F1F1F`
- **Margin Bottom:** `8px`
- **Display:** block

### Navigation

#### Primary Navigation Bar
- **Background:** `#FFFFFF` with subtle shadow `0 1px 3px rgba(0, 0, 0, 0.08)`
- **Height:** `64px`
- **Padding:** `0 32px`
- **Display:** flex
- **Align Items:** center
- **Justify Content:** space-between

#### Navigation Link (Default)
- **Color:** `#6B6B6B` (Mid Gray)
- **Text Decoration:** none
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 400
- **Padding:** `8px 0`
- **Border Bottom:** `2px solid transparent`
- **Transition:** `color 200ms, border-color 200ms`

#### Navigation Link (Active/Hover)
- **Color:** `#576F1F` (Forest Green)
- **Border Bottom:** `2px solid #576F1F`

#### Navigation Pill (Secondary Nav)
- **Background:** `#E6F0D6` (Sage Glass)
- **Text Color:** `#1F1F1F`
- **Padding:** `8px 16px`
- **Border Radius:** `20px`
- **Border:** `0px none`
- **Font Family:** Hanken Grotesk
- **Font Size:** `14px`
- **Font Weight:** 600
- **Hover State:** Background `#D0E5B8`

### Links

#### Text Link (Inline)
- **Color:** `#576F1F` (Forest Green)
- **Text Decoration:** underline
- **Font Family:** Hanken Grotesk
- **Font Size:** `16px`
- **Font Weight:** 400
- **Transition:** `color 150ms`
- **Hover State:** Color `#556B2F` (Deep Olive), text-decoration-color matches

#### Navigation Link Badge
- **Background:** `#C8DBA8` (Subtle Green Tint)
- **Color:** `#1F1F1F`
- **Padding:** `4px 12px`
- **Border Radius:** `20px`
- **Font Family:** Hanken Grotesk
- **Font Size:** `12px`
- **Font Weight:** 600
- **Display:** inline-block

### Badges

#### Status Badge (General)
- **Background:** `#E6F0D6` (Sage Glass)
- **Text Color:** `#3D4D1A` (Dark Green)
- **Padding:** `4px 12px`
- **Border Radius:** `16px`
- **Border:** `0px none`
- **Font Family:** Hanken Grotesk
- **Font Size:** `12px`
- **Font Weight:** 600

#### Label Tag
- **Background:** `#C8DBA8`
- **Text Color:** `#1F1F1F`
- **Padding:** `6px 12px`
- **Border Radius:** `12px`
- **Font Size:** `13px`
- **Font Weight:** 600

## 5. Layout Principles

### Spacing System
- **Base Unit:** `4px`
- **Scale:** `4px → 8px → 12px → 16px → 20px → 32px → 52px → 88px → 160px`
- **Usage Context:**
  - `4px`: Micro spacing between tight elements, badge padding
  - `8px`: Internal spacing within components, icon gaps
  - `12px`: Button padding, input padding, form gaps
  - `16px`: Card padding, section padding, common horizontal margins
  - `20px`: Gap between related component groups
  - `32px`: Standard section padding, horizontal page margins
  - `52px`: Hero section padding, large container padding
  - `88px`: Major section spacing, full-width container separation
  - `160px`: Page top/bottom margins, hero-to-content gaps

### Grid & Container
- **Max Width:** `1200px` (content container)
- **Column Strategy:** 12-column flexible grid or CSS Grid with `repeat(auto-fit, minmax(250px, 1fr))` for card layouts
- **Horizontal Margins:** `32px` on desktop, `16px` on tablet, `12px` on mobile
- **Section Pattern:** Full-width color blocks with centered max-width content container inside
- **Card Grids:** 2-column on desktop, 1-column on tablet/mobile; gap `20px` between cards

### Whitespace Philosophy
The design prioritizes generous breathing room around content. Sections are separated by significant vertical whitespace (`88px` or more) to allow the eye to reset between topics. Within cards and containers, padding scales proportionally—larger containers receive more internal padding to maintain visual balance. Margins between typography elements follow the spacing system to create natural visual hierarchy without reliance on visual effects.

### Border Radius Scale
- **Pill/Buttons:** `999px` (fully rounded)
- **Cards/Containers:** `16px` (generous, approachable curve)
- **Inputs/Smaller UI:** `8px` (subtle rounding)
- **Images within Cards:** `12px` (balanced between card and tighter containment)
- **Minor Elements (badges, tags):** `12px` to `16px` depending on size

## 6. Depth & Elevation

| Level | Treatment | Use |
|-------|-----------|-----|
| **Flat (0)** | No shadow, `box-shadow: none` | Default cards, buttons, static content |
| **Hover (+1)** | `box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06)` | Interactive card hover, floating elements on action |
| **Elevated (+2)** | `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1)` | Modals, dropdowns, sticky headers when scrolled |
| **Maximum (+3)** | `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12)` | Floating action buttons, prominent overlays |

**Depth Philosophy:** The design system avoids heavy shadows to maintain clarity and approachability. Elevation is communicated primarily through color contrast, border presence, and subtle shadow enhancement on interaction states. Shadows are warm-toned (rgba with slight brown cast) rather than pure black to align with the organic, inviting aesthetic. Depth is reserved for functional interaction states, not static layouts.

## 7. Do's and Don'ts

### Do
- **Use Forest Green (`#576F1F`) for primary CTAs** — it signals action and trust while remaining cohesive with the brand identity
- **Pair Alegreya headings with Hanken Grotesk body text** — this pairing creates distinctive hierarchy and maintains readability
- **Maintain generous padding in hero sections** — `52px` minimum, allowing content to breathe and emphasizing importance
- **Apply rounded pill buttons (`999px`)** — they feel approachable and modern, reinforcing community-forward positioning
- **Use card borders (`1px solid #D9D9D9`) instead of shadows** for definition in light themes — cleaner, more legible
- **Follow the spacing scale religiously** — consistency in `4px` multiples creates rhythm and predictability
- **Include hover states on all interactive elements** — subtle background shifts or border color changes maintain engagement
- **Leverage full-width hero sections** with centered max-width containers for high-impact storytelling
- **Test link colors on both light and dark backgrounds** — ensure Forest Green meets WCAG AA contrast minimums

### Don't
- **Don't apply multiple shadows** — stick to the elevation table; layered shadows create visual noise
- **Don't deviate from the primary color palette** — Forest Green and supporting neutrals should dominate
- **Don't use all-caps text in body or headings** — French language pairs with title case for natural readability and inclusivity
- **Don't mix serif and sans-serif in body text** — maintain clear hierarchy by reserving Alegreya for headers
- **Don't add drop shadows to cards on light backgrounds** — rely on subtle borders instead
- **Don't compress padding below `12px` inside interactive components** — touch targets become difficult to hit
- **Don't exceed `80px` line length for body text** on desktop — long lines harm readability; use multi-column layouts instead
- **Don't apply accent colors (`#9ACD32`, sage tints) as primary backgrounds** — reserve them for interactive states and highlights
- **Don't remove border underlines from links without hover/focus indication** — accessibility and discoverability suffer

## 8. Responsive Behavior

### Breakpoints

| Name | Width | Key Changes |
|------|-------|-------------|
| **Mobile** | `320px–639px` | Single column layout; padding `12px`; font sizes reduce by 10–15%; images full-width; navigation collapses to hamburger |
| **Tablet** | `640px–1023px` | 2-column grid for cards; padding `20px`; hero padding `32px`; larger touch targets |
| **Desktop** | `1024px–1440px` | Full multi-column grids; padding `32px`; heading sizes at scale; sidebar/aside patterns available |
| **Large Display** | `1440px+` | Max-width `1200px` centered; excess space managed with extended margins |

### Touch Targets
- **Minimum Size:** `44px × 44px` for all interactive elements (buttons, links, form inputs)
- **Recommended Size:** `48px × 48px` for common actions on mobile
- **Padding Buffer:** At least `8px` clearance between adjacent touch targets
- **Hit Area:** Extend to full button/link container; don't rely on text area alone
- **Fingers vs. Cursors:** Consider thumb-friendly placement (lower-left, lower-right quadrants) on mobile

### Collapsing Strategy
- **Navigation:** Horizontal bar on desktop/tablet → hamburger menu with slide-out drawer on mobile
- **Hero Section:** Full-width image beside text on desktop → stacked image-then-text on mobile
- **Card Grids:** Arrange as `4 cols → 3 cols → 2 cols → 1 col` as screen narrows; maintain minimum card width `250px`
- **Padding Reduction:** Desktop `32px` → Tablet `20px` → Mobile `12px` horizontal margins
- **Typography:** H1 `62px` on desktop → `44px` on tablet → `32px` on mobile; maintain 1.6–1.8 line-height ratio
- **Visibility:** Hide non-essential UI elements (secondary nav, decorative images) on mobile if space-constrained; prioritize content

## 9. Agent Prompt Guide

### Quick Color Reference
- **Primary CTA Button:** Forest Green (`#576F1F`)
- **Secondary CTA Button:** Transparent with gray text and light border (`transparent`, `#6B6B6B`, `#D9D9D9`)
- **Hero/Section Background:** Light Cream (`#F5F1E8`)
- **Card Background:** White (`#FFFFFF`)
- **Card Border:** Soft Border (`#D9D9D9`)
- **Navigation Active Link:** Forest Green (`#576F1F`) with underline
- **Body Text Color:** Dark Text (`#1F1F1F`)
- **Secondary Text:** Mid Gray (`#6B6B6B`)
- **Link Text:** Forest Green (`#576F1F`)
- **Heading Text:** Deep Olive (`#556B2F`) or Dark Text (`#1F1F1F`) depending on context
- **Badge/Pill Background:** Sage Glass (`#E6F0D6`)
- **Hover State Background:** Sage Glass (`#E6F0D6`) or subtle shift toward muted beige

### Iteration Guide
1. **Always start with Hanken Grotesk for body and UI text** (`16px`, weight `400` for body, `600` for emphasis); reserve Alegreya exclusively for headings and display text (`62px`, `45px`, `22px` with weight `700`).

2. **Primary buttons must be Forest Green (`#576F1F`) with white text**, `16px` font, `600` weight, `12px 32px` padding, and `999px` border-radius. Hover state shifts background to Deep Olive (`#556B2F`).

3. **Apply card styling consistently**: white background, `16px` padding, `16px` border-radius, `1px solid #D9D9D9` border, no shadow. Maintain spacing `20px` between cards in grids.

4. **Every interactive element must meet or exceed `44px` touch target minimum**; padding and margins scale from the `4px` base unit in multiples.

5. **Spacing between major sections is `88px` minimum**; internal padding within hero/container sections is `52px`. Follow the scale: `4px → 8px → 12px → 16px → 20px → 32px → 52px → 88px`.

6. **Links are Forest Green (`#576F1F`), underlined by default, with hover state shifting to Deep Olive (`#556B2F`)**; navigation links use pill styling only in secondary nav contexts (background `#E6F0D6`, padding `8px 16px`, radius `20px`).

7. **Borders and dividers prioritize low-contrast lines (`#D9D9D9`, `#E0DDD4`) over shadows**; if elevation is necessary, use subtle shadows from the elevation table (hover: `0 2px 8px rgba(0, 0, 0, 0.06)`).

8. **Hero sections and large containers use Light Cream (`#F5F1E8`) background to create visual separation** without relying on color intensity; text remains Dark Text (`#1F1F1F`) for high contrast.

9. **Form inputs default to white background, `1px solid #949494` border (contraste ≥ 3:1, WCAG 1.4.11), `8px` border-radius, `12px 16px` padding**; focus state adds border-color `#576F1F` and subtle green shadow `0 0 0 3px rgba(87, 111, 31, 0.1)`.

10. **On responsive breakpoints, reduce heading sizes proportionally** (H1: `62px → 44px → 32px`), shift card grids from multi-column to 2-column or 1-column, and collapse horizontal navigation into hamburger menu below `640px` width. Maintain minimum `12px` padding on mobile viewports.