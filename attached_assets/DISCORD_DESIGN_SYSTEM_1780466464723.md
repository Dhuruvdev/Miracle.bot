# DISCORD DESIGN SYSTEM — Complete AI-Agent Specification
> Version: 2025 Redesign (Visual Refresh — rolled out Feb–Mar 2025)  
> Purpose: Full pixel-level design reference for AI agents to reproduce Discord-style UI  
> Format: Token-first → Component → Layout → Motion → Accessibility

---

## TABLE OF CONTENTS
1. [Design Philosophy](#1-design-philosophy)
2. [Color System](#2-color-system)
3. [Typography System](#3-typography-system)
4. [Spacing & Sizing Scale](#4-spacing--sizing-scale)
5. [Border Radius System](#5-border-radius-system)
6. [Elevation & Shadow System](#6-elevation--shadow-system)
7. [Iconography & Assets](#7-iconography--assets)
8. [Layout Architecture](#8-layout-architecture)
9. [Component Library](#9-component-library)
10. [Animation & Motion](#10-animation--motion)
11. [Interaction States](#11-interaction-states)
12. [Accessibility Standards](#12-accessibility-standards)
13. [CSS Design Tokens (Ready-to-Use)](#13-css-design-tokens-ready-to-use)

---

## 1. DESIGN PHILOSOPHY

### Core Aesthetic Direction
- **Tone:** Dark, immersive, gaming-native, community-first
- **Feel:** Dense-but-breathable; information hierarchy through subtle contrast not loud color
- **2025 Refresh Principles:** Higher contrast ratios, darker blue-gray palette, larger border radii throughout, modern "card-separated" component feel
- **Key Differentiator:** The UI disappears — content (messages, people, voice) always comes first

### Design Principles
| Principle | Behavior |
|-----------|----------|
| **Hierarchy via Darkness** | Deeper Z-layer = darker background; content surfaces always lighter than surroundings |
| **Minimal Chrome** | Navigation chrome is desaturated and low-contrast until hovered/active |
| **Brand Punctuation** | Blurple (#5865F2) used sparingly — CTAs, active states, links, and notifications only |
| **Rounded Friendliness** | Aggressive border-radius signals approachability; this increased notably in 2025 |
| **Density with Breathing Room** | Compact by default with generous padding on interactive elements |

---

## 2. COLOR SYSTEM

### 2.1 Brand Colors (Canonical)

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Blurple** | `#5865F2` | rgb(88, 101, 242) | Primary CTA buttons, active states, focus rings, links |
| **Blurple (Legacy)** | `#7289DA` | rgb(114, 137, 218) | Old brand; sometimes used in embeds |
| **Green** | `#57F287` | rgb(87, 242, 135) | Online status, success, new messages |
| **Yellow** | `#FEE75C` | rgb(254, 231, 92) | Idle status, warnings |
| **Fuchsia** | `#EB459E` | rgb(235, 69, 158) | Boosting, special events |
| **Red** | `#ED4245` | rgb(237, 66, 69) | DND status, destructive actions, errors |
| **White** | `#FFFFFF` | rgb(255, 255, 255) | Inverse text, modals on dark |

---

### 2.2 Dark Theme — Background Layer Stack

> Discord uses a layered darkness model. Going deeper in hierarchy = darker surface.

| Token | Hex | HSL | Layer Role |
|-------|-----|-----|------------|
| `--background-primary` | `#36393F` | hsl(220, 8%, 24%) | Main chat area background |
| `--background-primary-2025` | `#323339` | hsl(228, 7%, 22%) | **New 2025** — slightly darker blue-gray main bg |
| `--background-secondary` | `#2F3136` | hsl(224, 7%, 20%) | Channel list, sidebars |
| `--background-secondary-alt` | `#292B2F` | hsl(220, 7%, 18%) | Alt sidebar, hover areas |
| `--background-tertiary` | `#202225` | hsl(220, 8%, 13%) | Server rail, deepest layer |
| `--background-accent` | `#4F545C` | hsl(218, 7%, 34%) | Subtle hover backgrounds, icon beds |
| `--background-floating` | `#18191C` | hsl(225, 7%, 10%) | Tooltips, dropdowns, modals overlay |
| `--background-nested-floating` | `#111214` | hsl(225, 8%, 8%) | Deep nested popouts |
| `--background-message-hover` | rgba(0,0,0,0.06) | — | Chat message row hover tint |
| `--background-message-highlight` | rgba(88,101,242,0.08) | — | Mentioned message highlight |
| `--background-mentioned` | rgba(250,168,26,0.10) | — | @mention highlight |

**Depth Order (lightest → darkest):**
```
Message Area (#36393F / #323339)
  → Channel Sidebar (#2F3136)
    → Channel Sidebar Alt (#292B2F)
      → Server Rail (#202225)
        → Modals/Tooltips (#18191C)
```

---

### 2.3 Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `--text-normal` | `#DCDDDE` | Primary message text, active UI labels |
| `--text-muted` | `#A3A6AA` | Timestamps, secondary labels, placeholder |
| `--text-low-contrast` | `#72767D` | Disabled text, fine print, muted channel names |
| `--text-link` | `#00B0F4` | Hyperlinks in chat |
| `--text-positive` | `#57F287` | Success messages, bot green responses |
| `--text-warning` | `#FEE75C` | Warning states |
| `--text-danger` | `#F38688` | Error text (softer red on dark bg) |
| `--text-brand` | `#949CF7` | Blurple-tinted accent text |
| `--header-primary` | `#FFFFFF` | Channel name header, modal titles |
| `--header-secondary` | `#B9BBBE` | Sub-headers, category labels |

---

### 2.4 Interactive / Semantic Colors

| Token | Hex | State |
|-------|-----|-------|
| `--interactive-normal` | `#B9BBBE` | Default interactive element |
| `--interactive-hover` | `#DCDDDE` | On hover |
| `--interactive-active` | `#FFFFFF` | On press / active |
| `--interactive-muted` | `#4F545C` | Disabled interactive |
| `--brand-experiment` | `#5865F2` | Blurple — primary brand accent |
| `--brand-experiment-hover` | `#4752C4` | Brand on hover |
| `--brand-experiment-active` | `#3C45A5` | Brand on press |

---

### 2.5 Status Colors (Presence Indicators)

| Status | Hex | Shape |
|--------|-----|-------|
| Online | `#23A55A` | Filled circle |
| Idle | `#F0B232` | Crescent / hollow circle |
| Do Not Disturb | `#F23F43` | Circle with horizontal dash |
| Offline | `#80848E` | Hollow circle |
| Streaming | `#593695` | Screen icon / teal in some contexts |

---

### 2.6 Light Theme Backgrounds (Reference)

| Token | Hex |
|-------|-----|
| `--background-primary` | `#FFFFFF` |
| `--background-secondary` | `#F2F3F5` |
| `--background-tertiary` | `#E3E5E8` |
| `--background-floating` | `#FFFFFF` |

---

## 3. TYPOGRAPHY SYSTEM

### 3.1 Font Families

| Role | Font | Notes |
|------|------|-------|
| **UI Primary** | `gg sans` | Discord's proprietary font (Dec 2022+). Geometric humanist sans-serif. Medium x-height, open apertures, rounded terminals. NOT publicly available. |
| **UI Fallback** | `Whitney`, then `DM Sans`, `Nunito` | Whitney was the pre-2022 font. DM Sans / Nunito are the closest public alternatives. |
| **Logo / Wordmark** | `Ginto Discord Bold` | Customized Ginto Nord — used only in branding, not UI. |
| **Code Blocks** | `Consolas` (Windows), `Menlo` (macOS), `monospace` | Used inside backtick code blocks in chat. |
| **Emergency Fallback Stack** | `"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif` | Discord's internal font stack in CSS. |

### 3.2 Font Weights

| Weight Name | Value | Usage |
|-------------|-------|-------|
| Regular | `400` | Body text, chat messages, descriptions |
| Medium | `500` | Channel names, navigation labels, sub-UI |
| Semibold | `600` | Button labels, usernames in chat |
| Bold | `700` | Server names, modal headings |
| Extrabold | `800` | Marketing headers, splash screen text |

### 3.3 Font Size Scale

| Role | Size | Line Height | Weight | Usage |
|------|------|-------------|--------|-------|
| `text-xs` | `10px` | `13px` | 500 | Badge counts, status labels |
| `text-xxs` | `11px` | `13px` | 600 | Category headers (uppercase) |
| `text-sm` | `12px` | `16px` | 400 | Timestamps, fine print, tooltips |
| `text-md` | `14px` | `18px` | 400 | Default UI: channel names, menu items |
| `text-base` | `16px` | `22px` | 400 | **Chat message body (default scale)** |
| `text-lg` | `18px` | `24px` | 600 | Channel header name |
| `text-xl` | `20px` | `24px` | 700 | Modal title, server name |
| `text-2xl` | `24px` | `30px` | 700 | Page headings |
| `text-display` | `32px+` | `1.2` | 800 | Marketing / empty state headings |

> **Chat Font Scaling:** Discord supports 12px–24px user-configurable chat font size (default 16px). The UI chrome always stays at 14px regardless.

### 3.4 Letter Spacing

| Context | Tracking |
|---------|----------|
| Navigation elements | `-0.02em` (slightly tighter) |
| Body text / chat | `0` (normal) |
| UPPERCASE category labels | `0.02em` to `0.05em` (wider) |
| Button labels | `-0.01em` |

### 3.5 Text Transform

| Element | Transform |
|---------|-----------|
| Channel category names | `UPPERCASE` |
| Section headers in settings | `UPPERCASE` |
| All other text | `none` |

---

## 4. SPACING & SIZING SCALE

### 4.1 Base Unit
```
1 spacing unit = 4px
```

### 4.2 Spacing Scale

| Token | Value | CSS Variable |
|-------|-------|-------------|
| `space-1` | `4px` | `--spacing-1` |
| `space-2` | `8px` | `--spacing-2` |
| `space-3` | `12px` | `--spacing-3` |
| `space-4` | `16px` | `--spacing-4` |
| `space-5` | `20px` | `--spacing-5` |
| `space-6` | `24px` | `--spacing-6` |
| `space-8` | `32px` | `--spacing-8` |
| `space-10` | `40px` | `--spacing-10` |
| `space-12` | `48px` | `--spacing-12` |

### 4.3 Component-Specific Spacing

| Component | Padding / Spacing |
|-----------|-------------------|
| Chat message row | `2px 16px` (cozy) / `1px 16px` (compact) |
| Message group gap | `16px–20px` top margin between message groups |
| Channel item (sidebar) | `1px 8px` vertical, `8px` left indent |
| Server icon | `12px` gap between icons |
| Input box padding | `11px 16px` |
| Context menu item | `6px 8px` |
| Modal padding | `16px 20px` |
| Settings section spacing | `40px` between sections |
| Button padding | `2px 16px` (small) / `8px 16px` (default) |

---

## 5. BORDER RADIUS SYSTEM

### 5.1 Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `radius-none` | `0px` | — |
| `radius-xs` | `2px` | Tiny badges, minimal elements |
| `radius-sm` | `3px` | Buttons (small), inline code |
| `radius-md` | `4px` | Message embeds, attachment previews |
| `radius-lg` | `8px` | Modals, context menus, inputs, cards |
| `radius-xl` | `12px` | User popout, rich embeds, large cards |
| `radius-xxl` | `16px` | Server icons on hover, large panels |
| `radius-full` | `50%` or `9999px` | Avatar circles, status dots, pills |

### 5.2 Per-Component Radius (2025 Values)

| Component | Radius |
|-----------|--------|
| Server icon (default) | `24px` (large squircle) |
| Server icon (hover/active) | `16px` |
| User avatar | `50%` (circle) |
| Channel item hover | `8px` |
| Chat input box | `8px` |
| Buttons (primary/secondary) | `3px` (was 3px; 2025 uses ~4-6px) |
| Context menus | `8px` |
| Modals | `8px` |
| Tooltips | `5px` |
| Embed borders (left accent) | `4px` |
| Search bar | `8px` (more rounded in 2025) |
| Role tags / badges | `4px` |
| Voice mini-panel (2025) | `12px` — "floated" card style |
| Popouts / hovers | `8px` |

---

## 6. ELEVATION & SHADOW SYSTEM

### 6.1 Elevation Layers

Discord achieves depth primarily through **background color darkening** rather than heavy shadows. Shadows are used sparsely.

| Level | Z-Index | Shadow | Use Case |
|-------|---------|--------|----------|
| Base | `0` | none | Chat area, message content |
| Raised | `100` | `0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05), 0 2px 0 rgba(4,4,5,0.05)` | Cards, embeds |
| Floating | `200` | `0 8px 16px rgba(0,0,0,0.24)` | Dropdowns, context menus |
| Modal | `300` | `0 8px 32px rgba(0,0,0,0.5)` | Modal dialogs |
| Tooltip | `400` | `0 4px 12px rgba(0,0,0,0.3)` | Tooltips, small popouts |
| Popout | `350` | `0 8px 16px rgba(0,0,0,0.24)` | User profile popouts |
| Overlay Scrim | `500` | background: `rgba(0,0,0,0.85)` | Modal backdrop |

### 6.2 Shadow Tokens (CSS)
```css
--elevation-low:   0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05);
--elevation-medium: 0 4px 4px rgba(0,0,0,0.16);
--elevation-high:  0 8px 16px rgba(0,0,0,0.24);
--elevation-modal: 0 8px 32px rgba(0,0,0,0.5);
```

---

## 7. ICONOGRAPHY & ASSETS

### 7.1 Icon Style
- **Style:** Outlined with 1.5–2px stroke, rounded endpoints
- **Grid:** 24×24px baseline; 16×16px for dense UI
- **Sizes in use:** 16px (channel icons), 20px (header icons), 24px (standard), 48px (empty states)
- **Filled vs Outlined:** Active states use filled variant; default uses outline
- **Icon Library:** Proprietary internal icons; closest public match is **Phosphor Icons** or **Heroicons** in rounded style

### 7.2 Avatar Specifications

| Type | Shape | Size | Notes |
|------|-------|------|-------|
| User avatar (message) | Circle (`50%`) | `40px × 40px` | Left of message group |
| User avatar (compact) | Circle | `32px × 32px` | — |
| Server icon | Squircle (24px radius → 16px hover) | `48px × 48px` | Displayed in server rail |
| Group DM icon | Circle with 2 overlapping avatars | `32px × 32px` | — |
| Bot avatar | Circle + "BOT" badge overlay | `40px × 40px` | — |
| Status indicator | Circle dot | `10px × 10px` | Bottom-right of avatar, `2px` white border |

### 7.3 Emoji & Rich Content
- Emoji size in chat: `22px` (inline), `32px–48px` (emoji-only messages)
- Attachment preview max width: `400px`, max height: `300px`
- Sticker display: `160px × 160px`

---

## 8. LAYOUT ARCHITECTURE

### 8.1 Three-Column Shell (Desktop)

```
┌─────────────────────────────────────────────────────────────────┐
│ WINDOW CHROME (title bar: ~22px on Windows / 0px on macOS)      │
├──────┬────────────────┬──────────────────────────┬──────────────┤
│      │                │  HEADER BAR (48px)        │              │
│  S   │   CHANNEL      │──────────────────────────│  MEMBER      │
│  E   │   SIDEBAR      │                          │  LIST        │
│  R   │   (240px)      │   CHAT / CONTENT AREA    │  (240px)     │
│  V   │                │                          │  (optional)  │
│  E   │                │   (flex-grow: 1)         │              │
│  R   │                │                          │              │
│      │                │──────────────────────────│              │
│  R   │                │  MESSAGE INPUT (≥44px)   │              │
│  A   ├────────────────┴──────────────────────────┴──────────────┤
│  I   │                   BOTTOM STATUS BAR (52px)               │
│  L   │                                                           │
│(48px)│                                                           │
└──────┴───────────────────────────────────────────────────────────┘
```

### 8.2 Column Widths

| Column | Width | Background |
|--------|-------|------------|
| Server Rail | `72px` (icon + padding) | `#202225` |
| Channel Sidebar | `240px` (user-resizable min 48px) | `#2F3136` |
| Content / Chat | `flex: 1 1 auto` (takes remaining) | `#36393F` / `#323339` |
| Member List | `240px` (toggleable) | `#2F3136` |

### 8.3 Channel Header (Top Bar)

- **Height:** `48px`
- **Background:** Matches chat area (#36393F) with a subtle `1px` bottom border (`rgba(0,0,0,0.2)`)
- **2025 Redesign:** A new "current server/DM" indicator bar sits above in the top-left, ~`36px` tall
- **Contents:** `#` icon + channel name (bold, white) + topic + icons (right-aligned: members, search, inbox, help)
- **Font:** `16px`, `600` weight, `#FFFFFF`

### 8.4 Message Input Area

- **Height:** Variable; minimum `44px`, grows up to ~`50%` viewport
- **Background:** `#40444B` → 2025: lighter, `#383A40` with border radius `8px`
- **Inner padding:** `11px 16px`
- **Bottom padding from viewport edge:** `16px–24px`
- **Placeholder text:** `#72767D`, 16px

### 8.5 Server Rail (Icon Column)

- **Width:** `72px`
- **Background:** `#202225`
- **Server icon size:** `48px × 48px`
- **Server icon gap:** `8px`
- **Active indicator:** `4px` white pill on the left edge of the rail, vertically centered to icon
- **Hover indicator:** `8px` wide pill (smaller than active)
- **Bottom items:** DM icon, Discover, Download app icons

### 8.6 Channel Sidebar

- **Width:** `240px`
- **Background:** `#2F3136`
- **Padding:** `8px 0`
- **Channel item height:** `32px` (with 2px top/bottom padding = 34px visual)
- **Channel item padding:** `0 8px`
- **Active channel:** `#36393F` background, `#FFFFFF` text
- **Hovered channel:** `rgba(79,84,92,0.4)` background, `#DCDDDE` text
- **Category header:** `12px`, `UPPERCASE`, `500` weight, `#8E9297` color, `8px 8px` padding
- **Voice channel user row:** `24px` height, `#B9BBBE` text, avatar `16px`

### 8.7 User Panel (Bottom-Left)

- **Height:** `52px`
- **Background:** `#292B2F` (slightly darker than sidebar)
- **Contents:** Avatar (`32px`) + Username (`14px`, `600`, `#FFFFFF`) + discriminator/status (`12px`, `#B9BBBE`) + Mute / Deafen / Settings icons
- **Icon size:** `20px`

### 8.8 Message Layout

```
┌────────────────────────────────────────────────────────┐
│  [Avatar 40px]  [Username]  [Timestamp]                │
│                 [Message text, 16px, #DCDDDE]          │
│                 [Message text continued...]            │
│                 [Attachment / Embed]                   │
│                 [Reaction pills]                       │
└────────────────────────────────────────────────────────┘
```

- **Avatar left margin:** `16px`
- **Avatar→text gap:** `12px`
- **Username:** `16px`, `500` weight, colored by role or `#FFFFFF`
- **Timestamp:** `12px`, `#72767D`, `margin-left: 4px`
- **Consecutive messages (no avatar):** `44px` left indent, `1.375` line height
- **Message group gap (between users):** `17px–20px`
- **Hover toolbar (action bar):** Appears top-right of message on hover; Add Reaction, Reply, More

---

## 9. COMPONENT LIBRARY

### 9.1 Buttons

```
PRIMARY BUTTON
  Background:   #5865F2
  Hover:        #4752C4
  Active:       #3C45A5
  Text:         #FFFFFF
  Font:         14px, 500 weight
  Padding:      8px 16px
  Radius:       4px (3px in 2025 is slightly rounded)
  Height:       32px (small) / 38px (default)

SECONDARY BUTTON (Outline)
  Background:   transparent
  Border:       1px solid #4F545C
  Hover bg:     rgba(79,84,92,0.16)
  Text:         #FFFFFF
  Same padding/radius as primary

DESTRUCTIVE BUTTON
  Background:   #ED4245
  Hover:        #C03537
  Text:         #FFFFFF

GHOST / LINK BUTTON
  Background:   none
  Text:         #00B0F4 (link color)
  Hover:        underline

DISABLED STATE (all buttons)
  Opacity: 0.3
  cursor: not-allowed
```

### 9.2 Input Fields

```
TEXT INPUT
  Background:   #202225
  Border:       1px solid rgba(0,0,0,0.3)
  Focus border: 1px solid #5865F2
  Text:         #DCDDDE
  Placeholder:  #72767D
  Font:         16px, 400
  Padding:      10px
  Radius:       8px (2025)
  Height:       40px (single line)
```

### 9.3 Modals

```
MODAL
  Background:   #36393F
  Radius:       8px
  Shadow:       0 8px 32px rgba(0,0,0,0.5)
  Overlay:      rgba(0,0,0,0.85)
  Max width:    440px (small) / 660px (medium)
  Padding:      16px 20px
  Title font:   20px, 700, #FFFFFF
  Body font:    16px, 400, #DCDDDE
  Close button: top-right, 24px ✕ icon, #B9BBBE
```

### 9.4 Context Menus

```
CONTEXT MENU
  Background:   #18191C
  Radius:       8px
  Shadow:       0 8px 16px rgba(0,0,0,0.24)
  Min width:    188px
  Padding:      6px 8px

  MENU ITEM
    Height:     32px
    Padding:    6px 8px
    Font:       14px, 400, #DCDDDE
    Radius:     4px
    Hover bg:   #5865F2 (active item = blurple!)
    Hover text: #FFFFFF

  SEPARATOR
    Height:     1px
    Margin:     4px 0
    Color:      rgba(79,84,92,0.6)
```

### 9.5 Tooltips

```
TOOLTIP
  Background:   #18191C
  Text:         #DCDDDE
  Font:         14px, 400
  Padding:      8px 12px
  Radius:       5px
  Shadow:       0 4px 12px rgba(0,0,0,0.3)
  Max width:    200px
  Arrow:        6px triangle on appropriate side
```

### 9.6 Badges & Pills

```
NOTIFICATION BADGE (red count)
  Background:   #ED4245
  Text:         #FFFFFF
  Font:         12px, 600
  Min size:     16px × 16px
  Radius:       8px (pill)
  Position:     bottom-right of server icon or absolute overlay

MENTION BADGE
  Background:   #ED4245
  Same as notification badge

ROLE TAG
  Background:   [role hex color] at 10% opacity (or solid)
  Border:       1px solid [role hex]
  Radius:       4px
  Padding:      0 4px
  Font:         12px, 500

ONLINE INDICATOR (status dot)
  Size:         10px
  Border:       2px solid parent background (creates ring effect)
```

### 9.7 Embeds

```
EMBED
  Left border:   4px solid [author/brand color]
  Background:    #2F3136
  Radius:        4px
  Padding:       8px 16px 16px 12px
  Max width:     520px

  Title:         16px, 600, #FFFFFF / #00B0F4 if link
  Description:   14px, 400, #DCDDDE
  Field label:   14px, 700, #DCDDDE
  Field value:   14px, 400, #DCDDDE
  Footer:        12px, 400, #B9BBBE
```

### 9.8 Channel Category (Sidebar Header)

```
CATEGORY
  Font:         11px, 600 (semibold)
  Color:        #8E9297 (default) → #DCDDDE (hover)
  Transform:    UPPERCASE
  Letter-spacing: 0.02em
  Padding:      16px 8px 4px 8px
  Chevron:      8px, right-side, rotates 90° when collapsed
```

### 9.9 Reaction Chips

```
REACTION
  Background:   rgba(79,84,92,0.3)
  Hover:        rgba(88,101,242,0.15) + border: 1px solid #5865F2
  Border:       1px solid rgba(79,84,92,0.4)
  Radius:       8px
  Padding:      4px 6px
  Font:         14px (emoji) + 12px count #B9BBBE
  Gap:          4px between emoji and count
```

### 9.10 Voice Channel Panel (2025 Redesign)

```
VOICE PANEL (floating card)
  Background:   #292B2F
  Radius:       12px  ← NEW in 2025, "floated" appearance
  Margin:       8px from sidebar edge
  Padding:      8px
  Shadow:       0 4px 12px rgba(0,0,0,0.3)
  
  Contains: server name, voice channel name, user avatars, mute/deafen/disconnect icons
```

---

## 10. ANIMATION & MOTION

### 10.1 Easing Functions

| Name | Curve | Usage |
|------|-------|-------|
| `ease-default` | `cubic-bezier(0.2, 0, 0, 1)` | General UI transitions |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering screen |
| `ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Server icon hover, reactions |
| `ease-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.1)` | Message send animation |

### 10.2 Duration Scale

| Token | Value | Usage |
|-------|-------|-------|
| `duration-instant` | `50ms` | Hover state fills |
| `duration-fast` | `100ms` | Button press feedback |
| `duration-normal` | `200ms` | Sidebar toggles, tooltip appear |
| `duration-slow` | `300ms` | Modal enter/exit |
| `duration-slower` | `500ms` | Page-level transitions |

### 10.3 Specific Animations

| Element | Animation |
|---------|-----------|
| Server icon (hover) | Scale `1.0 → 1.1`, radius `24px → 16px` in `200ms ease-bounce` |
| Message send | Subtle `opacity 0 → 1` + `translateY(4px → 0)` in `100ms` |
| Modal enter | `scale(0.95) → scale(1)` + `opacity 0 → 1` in `200ms ease-out` |
| Modal exit | `scale(1) → scale(0.9)` + `opacity 1 → 0` in `150ms ease-in` |
| Context menu appear | `scaleY(0.8) → scaleY(1)` from origin top in `150ms ease-out` |
| Tooltip appear | `opacity 0 → 1` + `translateY(-4px → 0)` in `150ms ease-out` |
| Channel hover | Background fill in `100ms ease` |
| Unread pulse | Subtle `box-shadow` ping glow on status dot |
| Reaction add | Scale bounce `1 → 1.2 → 1` in `200ms ease-bounce` |
| Notification badge | Appears with `scale(0.5) → scale(1)` bounce |

---

## 11. INTERACTION STATES

### 11.1 State Matrix

| Element | Default | Hover | Active/Pressed | Focused | Disabled |
|---------|---------|-------|----------------|---------|----------|
| Button (primary) | `#5865F2` | `#4752C4` | `#3C45A5` | `+ box-shadow: 0 0 0 3px rgba(88,101,242,0.3)` | `opacity: 0.3` |
| Channel item | transparent | `rgba(79,84,92,0.4) bg` | `#36393F bg` | — | — |
| Server icon | `border-radius: 24px` | `border-radius: 16px, scale 1.1` | `scale: 0.95` | — | `opacity: 0.5` |
| Menu item | transparent | `#5865F2 bg, #FFFFFF text` | `#4752C4 bg` | — | `opacity: 0.3` |
| Input | `#202225 bg` | — | — | `border: 1px solid #5865F2` | `opacity: 0.5` |
| Message row | transparent | `rgba(0,0,0,0.06) overlay` | — | — | — |

### 11.2 Focus Ring

```css
focus-ring: 0 0 0 3px rgba(88, 101, 242, 0.5);
/* Used on all keyboard-focusable elements */
/* Only visible on keyboard navigation (not mouse click) */
```

---

## 12. ACCESSIBILITY STANDARDS

| Standard | Value |
|----------|-------|
| **Minimum contrast (text)** | 4.5:1 (WCAG AA) |
| **Large text contrast** | 3:1 |
| **Focus indicator** | 3px blurple ring, visible on keyboard nav |
| **Reduced motion** | Respects `prefers-reduced-motion: reduce` — disables transitions |
| **Font scaling** | Chat font adjustable 12–24px |
| **Color-blind safe** | Status uses shape + color (never color alone) |

---

## 13. CSS DESIGN TOKENS (READY-TO-USE)

```css
/* =========================================================
   DISCORD DESIGN SYSTEM TOKENS — 2025 DARK THEME
   Copy and paste into any project to replicate Discord aesthetics
   ========================================================= */

:root {
  /* ── BRAND COLORS ──────────────────────────────────────── */
  --discord-blurple:            #5865F2;
  --discord-blurple-hover:      #4752C4;
  --discord-blurple-active:     #3C45A5;
  --discord-green:              #57F287;
  --discord-yellow:             #FEE75C;
  --discord-fuchsia:            #EB459E;
  --discord-red:                #ED4245;
  --discord-white:              #FFFFFF;

  /* ── BACKGROUND LAYERS ─────────────────────────────────── */
  --bg-chat:                    #323339;  /* 2025: main chat (was #36393F) */
  --bg-chat-legacy:             #36393F;
  --bg-sidebar:                 #2F3136;
  --bg-sidebar-alt:             #292B2F;
  --bg-rail:                    #202225;
  --bg-floating:                #18191C;
  --bg-nested:                  #111214;
  --bg-accent:                  #4F545C;
  --bg-input:                   #40444B;
  --bg-user-panel:              #292B2F;

  /* ── TEXT ───────────────────────────────────────────────── */
  --text-normal:                #DCDDDE;
  --text-muted:                 #A3A6AA;
  --text-faint:                 #72767D;
  --text-link:                  #00B0F4;
  --text-positive:              #57F287;
  --text-warning:               #FEE75C;
  --text-danger:                #F38688;
  --text-brand:                 #949CF7;
  --header-primary:             #FFFFFF;
  --header-secondary:           #B9BBBE;

  /* ── INTERACTIVE ────────────────────────────────────────── */
  --interactive-normal:         #B9BBBE;
  --interactive-hover:          #DCDDDE;
  --interactive-active:         #FFFFFF;
  --interactive-muted:          #4F545C;

  /* ── STATUS ─────────────────────────────────────────────── */
  --status-online:              #23A55A;
  --status-idle:                #F0B232;
  --status-dnd:                 #F23F43;
  --status-offline:             #80848E;

  /* ── TYPOGRAPHY ─────────────────────────────────────────── */
  --font-primary:               "gg sans", "Noto Sans", "Helvetica Neue", Arial, sans-serif;
  --font-code:                  Consolas, "Andale Mono WT", "Andale Mono", "Lucida Console", monospace;
  --font-size-base:             16px;
  --font-size-ui:               14px;
  --font-size-label:            12px;
  --font-size-micro:            11px;
  --font-size-heading:          20px;

  /* ── SPACING ────────────────────────────────────────────── */
  --spacing-1:                  4px;
  --spacing-2:                  8px;
  --spacing-3:                  12px;
  --spacing-4:                  16px;
  --spacing-5:                  20px;
  --spacing-6:                  24px;
  --spacing-8:                  32px;
  --spacing-10:                 40px;
  --spacing-12:                 48px;

  /* ── BORDER RADIUS ──────────────────────────────────────── */
  --radius-xs:                  2px;
  --radius-sm:                  3px;
  --radius-md:                  4px;
  --radius-lg:                  8px;
  --radius-xl:                  12px;
  --radius-xxl:                 16px;
  --radius-full:                50%;

  /* ── ELEVATION / SHADOWS ────────────────────────────────── */
  --shadow-low:                 0 1px 0 rgba(4,4,5,0.2), 0 1.5px 0 rgba(6,6,7,0.05);
  --shadow-medium:              0 4px 4px rgba(0,0,0,0.16);
  --shadow-high:                0 8px 16px rgba(0,0,0,0.24);
  --shadow-modal:               0 8px 32px rgba(0,0,0,0.5);
  --shadow-tooltip:             0 4px 12px rgba(0,0,0,0.3);

  /* ── LAYOUT DIMENSIONS ──────────────────────────────────── */
  --layout-server-rail-width:   72px;
  --layout-sidebar-width:       240px;
  --layout-member-list-width:   240px;
  --layout-channel-header-height: 48px;
  --layout-user-panel-height:   52px;
  --layout-input-min-height:    44px;

  /* ── TRANSITIONS ────────────────────────────────────────── */
  --transition-fast:            100ms cubic-bezier(0.2, 0, 0, 1);
  --transition-normal:          200ms cubic-bezier(0.2, 0, 0, 1);
  --transition-slow:            300ms cubic-bezier(0.2, 0, 0, 1);
  --transition-bounce:          200ms cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* ── DARK THEME OVERRIDES ─────────────────────────────────── */
.theme-dark {
  --background-primary:         var(--bg-chat);
  --background-secondary:       var(--bg-sidebar);
  --background-tertiary:        var(--bg-rail);
  color-scheme: dark;
}

/* ── LIGHT THEME OVERRIDES ───────────────────────────────── */
.theme-light {
  --bg-chat:                    #FFFFFF;
  --bg-sidebar:                 #F2F3F5;
  --bg-rail:                    #E3E5E8;
  --text-normal:                #2E3338;
  --header-primary:             #060607;
  color-scheme: light;
}

/* ── FOCUS RING ──────────────────────────────────────────── */
:focus-visible {
  outline: none;
  box-shadow: 0 0 0 3px rgba(88, 101, 242, 0.5);
}

/* ── SCROLLBAR STYLING ────────────────────────────────────── */
::-webkit-scrollbar {
  width: 8px;
  background: transparent;
}
::-webkit-scrollbar-thumb {
  background: var(--bg-floating);
  border-radius: 4px;
  min-height: 40px;
}
::-webkit-scrollbar-track {
  background: transparent;
  border-radius: 4px;
}
```

---

## APPENDIX A: QUICK REFERENCE CHEAT SHEET

| What | Value |
|------|-------|
| Primary font | GG Sans / DM Sans (fallback) |
| Chat bg | `#323339` (2025) |
| Sidebar bg | `#2F3136` |
| Server rail bg | `#202225` |
| Brand accent | `#5865F2` (Blurple) |
| Primary text | `#DCDDDE` |
| Muted text | `#A3A6AA` |
| Channel header height | `48px` |
| Server rail width | `72px` |
| Sidebar width | `240px` |
| Base spacing unit | `4px` |
| Default border radius | `8px` |
| Message font size | `16px` |
| UI label font size | `14px` |
| Category label | `11px UPPERCASE 600` |

---

## APPENDIX B: RECREATING DISCORD DARK THEME WITHOUT GG SANS

Since GG Sans is proprietary, use this substitute stack:

```css
font-family: "DM Sans", "Nunito", "Inter", system-ui, sans-serif;
```

Adjust tracking for nav labels:
```css
.channel-name { letter-spacing: -0.01em; }
.category-header { letter-spacing: 0.03em; text-transform: uppercase; }
```

---

*Last updated: June 2026 — based on Discord's 2025 Visual Refresh design system*  
*Sources: BetterDiscord CSS documentation, official Discord color palette references, Discord 2025 redesign analysis*
