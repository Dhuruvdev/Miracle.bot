# OpenEmbedded — Project Bible

> **Mission:** Build the next-generation visual builder for Discord UI components — powerful enough for engineers, simple enough for anyone.

---

## Table of Contents

1. [What Is OpenEmbedded](#1-what-is-openembedded)
2. [The Vision](#2-the-vision)
3. [Monorepo Architecture](#3-monorepo-architecture)
4. [The Component SDK](#4-the-component-sdk)
5. [State Management](#5-state-management)
6. [The Visual Builder UI](#6-the-visual-builder-ui)
7. [Discord Integration — Webhooks](#7-discord-integration--webhooks)
8. [Discord Integration — Bot Gateway](#8-discord-integration--bot-gateway)
9. [Interaction System](#9-interaction-system)
10. [Code Generation Engine](#10-code-generation-engine)
11. [Authentication & Security](#11-authentication--security)
12. [Internationalisation](#12-internationalisation)
13. [Design System & Pixel Decisions](#13-design-system--pixel-decisions)
14. [Data Flow — End to End](#14-data-flow--end-to-end)
15. [File Map](#15-file-map)
16. [Supported Libraries & Languages](#16-supported-libraries--languages)
17. [What We Are Building Next](#17-what-we-are-building-next)

---

## 1. What Is OpenEmbedded

OpenEmbedded is a **visual, drag-and-drop builder for Discord's UI component system**. Discord introduced a new generation of message components in 2024/2025 — containers, sections, media galleries, separators, text displays, and more. These components form rich, interactive, embed-like messages that bots can send.

Before OpenEmbedded, the only way to build these was to write raw JSON or library-specific code by hand. OpenEmbedded eliminates that entirely. Users design their Discord components visually, see a pixel-accurate live preview, then either:

- **Send directly** to Discord via webhook or a connected bot
- **Export** production-ready code in their library of choice

It is simultaneously a design tool, a testing sandbox, an interaction configurator, and a code generator.

---

## 2. The Vision

> "New Gen Embedded builder for Discord — user friendly and Powerful."

The two pillars are **accessibility** and **depth**:

| Pillar | What it means |
|--------|--------------|
| **User Friendly** | No JSON knowledge required. Drag. Click. Send. Anyone can use it. |
| **Powerful** | Full component coverage, live bot interactions, multi-language codegen, file uploads, interaction step chains. Engineers get everything they need. |

OpenEmbedded is not a simple form — it is a **programmable visual IDE for Discord messages**. The motive is to be the definitive tool that every Discord bot developer reaches for first, whether they are a hobbyist clicking buttons or a professional engineer copying generated TypeScript into a production bot.

---

## 3. Monorepo Architecture

The project is a **Yarn 4 workspace monorepo** with three packages and one shared config layer:

```
/
├── components-sdk/       # Standalone React UI component library
├── website/              # Main Vite + React frontend application
├── server/               # Node.js + Express backend
├── api/                  # Vercel-compatible serverless proxy entry point
├── package.json          # Workspace root (Yarn 4 workspaces)
├── start-dev.sh          # Dev startup script (installs → starts server → starts Vite)
└── start.sh              # Production startup script
```

### How the pieces connect

```
Browser (website)
    │
    ├── /api/* proxy → server (port 3001)  [Vite dev proxy]
    │
    ├── components-sdk (aliased in dev, bundled in prod)
    │       └── Provides Capsule, all component types, DnD
    │
    └── localStorage
            └── Persists: webhook URL, bot token, guild ID, channel ID,
                          button action configs, component tree state
```

The **server** runs as a persistent process alongside the frontend, maintaining the Discord Gateway WebSocket connection so the bot stays online even when the user closes their browser tab.

---

## 4. The Component SDK

**Path:** `components-sdk/src/`

The SDK is the visual engine. It is a self-contained React library that knows how to render every Discord component type as an interactive, editable preview — exactly matching what Discord renders in the actual client.

### Component Types

| Discord Type ID | Name | What it is |
|----------------|------|-----------|
| `1` | **ActionRow** | A horizontal row holding up to 5 buttons, or 1 select menu |
| `2` | **Button** | Clickable button — Blue, Grey, Green, Red, or Link styles |
| `3` | **StringSelect** | A dropdown select menu with up to 25 options |
| `9` | **Section** | A two-column layout: text on the left, thumbnail or button on the right |
| `10` | **TextDisplay** | A rich text block supporting Discord markdown |
| `11` | **Thumbnail** | A small image accessory (used inside Section) |
| `12` | **MediaGallery** | A grid of up to 10 images |
| `13` | **File** | A file attachment (supports `attachment://` local file references) |
| `14` | **Separator** | A visual divider line with small or large spacing |
| `17` | **Container** | A wrapper with optional accent color and spoiler blur |

### The `Capsule` Component

`Capsule` is the root of the SDK. It is the main export consumed by the website. It receives:

- `state: Component[]` — the current component tree
- `stateManager: StateManager` — callbacks to mutate the tree
- `passProps: PassProps` — injected polyfills (EmojiPicker, ColorPicker, etc.)
- `errors` — field-level validation errors from Discord API responses

`Capsule` renders the full interactive preview with drag-and-drop, add/delete controls, and inline editing.

### Drag & Drop

The DnD system is entirely custom-built (no library). Located in `components-sdk/src/dnd/`:

- **`DragContext`** — React context holding the currently dragged item and its source key path
- **`handleDragOver.ts`** — calculates which drop zone the cursor is nearest to
- **`handleDragDrop.ts`** — executes the move by dispatching `addKey` (insert at target) and `deleteKey` (remove from source) in a single atomic operation
- **`DroppableID`** — typed IDs for each drop zone in the tree
- **`BoundariesProps`** — defines what component types are allowed to be dropped into which container

Supported drag operations:
- Reorder components within the same parent
- Move a component from one container to another
- Drag raw JSON text from outside the browser → auto-parsed into a component
- Drag plain text from outside → auto-converted to a `TextDisplay`

### Polyfill System

The SDK is host-agnostic. It defines TypeScript interfaces for external UI that the host application must provide:

| Polyfill | What the host provides |
|----------|----------------------|
| `BetterInput` | An enhanced text input with Discord markdown toolbar |
| `EmojiPicker` | An emoji selector (emoji-mart) |
| `ColorPicker` | A hex color picker (react-color) |
| `EmojiShow` | Renders an emoji inline (custom/unicode) |
| `ActionMenu` | The button interaction configurator panel |
| `StateManager` | The tree mutation callbacks (add, delete, set, wrap, append) |
| `getFile` / `setFile` | File blob read/write for `attachment://` URLs |

---

## 5. State Management

**Path:** `website/src/state.ts`

The component tree is managed by **Redux Toolkit**. The entire state lives in a single slice called `display`.

### State Shape

```typescript
{
  data: Component[],          // The live component tree
  isDefault: boolean,         // True if user hasn't modified yet (shows welcome banner)
  webhookUrl: string,         // Persisted to localStorage
  webhookResponse: object | null,  // Last Discord API response
  showThread: boolean         // Whether the thread ID field is visible
}
```

### Tree Mutation Reducers

Because Discord components form a deeply nested tree, Redux alone is not enough. Five custom path-based reducers handle all mutations:

| Reducer | Purpose |
|---------|---------|
| `setKey(key, value)` | Set any value at a deep path (e.g. change a button label) |
| `addKey(key, index, value)` | Insert a component at a position in an array |
| `deleteKey(key)` | Remove a component from its parent array |
| `appendKey(key, value)` | Push to the end of an array |
| `wrapKey(key, wrapper, innerKey)` | Wrap a component in a new parent (e.g. wrap a Button in an ActionRow) |

The `addKey` reducer has special logic: when a drag-and-drop moves an item, it simultaneously tracks the source deletion index and adjusts it if the insertion shifts the array indices — ensuring atomic moves without index drift.

### `DisplaySliceManager`

The `DisplaySliceManager` class implements the `StateManager` interface from the SDK. It wraps all five reducers and is passed into `Capsule` as `stateManager`. This is the bridge between the SDK's drag-and-drop/editing system and the Redux store.

### Response Builder Store

The **Response Builder Modal** (used when configuring a "Reply with embed/components" interaction step) gets its own isolated Redux store (`createResponseBuilderStore`), completely separate from the main store. This lets users build a nested component layout for a bot reply without affecting the main canvas.

---

## 6. The Visual Builder UI

**Path:** `website/src/App.tsx`, `website/src/App.module.css`

### Layout

The main app is a **two-column grid**:

```
┌─────────────────────────────────────────────┐
│  Alert banner (welcome / codegen mode)      │ ← full width, dismissible
├────────────────────┬────────────────────────┤
│                    │                        │
│   LEFT COLUMN      │   RIGHT COLUMN         │
│   (sticky, scroll) │   (sticky, scroll)     │
│                    │                        │
│   Live Discord     │   • App title          │
│   component        │   • Webhook sender     │
│   preview          │   • Bot connector      │
│   (Capsule)        │   • Interaction list   │
│                    │   • Code generator     │
│                    │   • Language switcher  │
│                    │   • Footer             │
└────────────────────┴────────────────────────┘
```

On screens narrower than 1200px it stacks vertically (preview first, then controls).

### Left Column — The Preview

Renders `<Capsule>` with the live component tree. It is fully interactive — clicking any element in the preview opens its editor. This is a real Discord-accurate rendering, not a mockup.

### Right Column — The Control Panel

Everything a user needs to send and export:

#### Section 1 — Webhook Sender
- URL input for a Discord webhook
- "Send" button (disabled until a valid webhook URL is detected)
- Thread toggle — adds a thread ID field for sending to threads or creating forum posts
- A `<dialog>` modal for setting a post title when sending to a forum channel

#### Section 2 — Bot Connector
- Bot token input (type=password, stored in localStorage, never sent to any server except Discord's own API)
- Live gateway status indicator: ● Connecting / ● Online / ● Error
- Start / Restart / Stop bot buttons
- Server (guild) picker — dropdown loaded after bot connects
- Channel picker — grouped by category, filtered to text channels only
- "Send Message" button — sends the current component tree via the bot

#### Section 3 — Button Interactions

If the canvas contains any buttons with `custom_id` values that have been configured with interactions, they are listed here as cards showing all configured steps.

#### Section 4 — Code Generator

The `<Codegen>` component renders below the controls. A dropdown lets the user pick any supported library, and the code block updates in real time as the component tree changes.

---

## 7. Discord Integration — Webhooks

**Path:** `website/src/webhook.impl.ts`

The webhook path is entirely **client-side**. The browser sends directly to Discord's API — no server involved.

### How a send works

1. User pastes a Discord webhook URL
2. App parses the URL, adds `?with_components=true` query parameter
3. On "Send", `webhookImplementation.prepareRequest(state)` runs:
   - Scans the component tree for `attachment://` URLs
   - For each found: grabs the `Blob` from `window.uploadedFiles`
   - If files exist → builds a `multipart/form-data` body with `payload_json` + `files[N]`
   - If no files → sends plain JSON with `Content-Type: application/json`
4. Request body always includes `flags: 32768` (Components V2 flag — required by Discord)
5. Response is displayed as raw JSON if it contains errors (field-level errors are parsed and shown on the relevant component in the preview)

### Thread / Forum support

- If the webhook URL contains `?thread_id=...`, the message is sent into that thread
- If the user clicks "send to thread instead", a thread ID field appears
- For forum channels, clicking Send opens a dialog requesting a post title — the request is then sent with `thread_name` in the payload

---

## 8. Discord Integration — Bot Gateway

**Two-tier architecture:** the browser handles the short-lived connection for status display, and the **server maintains the persistent connection** for interaction handling.

### Browser-side (`website/src/BotGateway.ts`)

`BotGateway` is a TypeScript class that wraps a browser WebSocket to `wss://gateway.discord.gg`. It handles:

- **HELLO (op 10)** → starts heartbeat with proper jitter (random 0–1× interval delay as Discord requires)
- **HEARTBEAT_ACK (op 11)** → marks ACK received; if missed, closes with "zombied connection" error
- **Server heartbeat request (op 1)** → responds immediately
- **READY (op 0)** → fires `onStatus('connected')`
- **Invalid session (op 9)** → fires error, disconnects
- All 4xxx close codes → mapped to human-readable error messages

### Server-side (`server/src/index.js`)

The server's gateway connection is more advanced:

- **Session resumption** — stores `session_id` and `resume_gateway_url`; on reconnect attempts RESUME (op 6) before falling back to full IDENTIFY (op 2)
- **Exponential backoff** — reconnect delay = `min(1000 × 2^attempts, 30000)ms + jitter`
- **INTERACTION_CREATE handling** — listens for button clicks and select menu selections from Discord users and executes the configured action steps

### Message sending via bot

When the user clicks "Send Message" on the bot path:

1. Browser collects any file blobs, base64-encodes them
2. POSTs to `/api/bot/channels/:channelId/messages`
3. Server reconstructs the `multipart/form-data` with actual `Blob` objects
4. Sends to Discord API with the bot token
5. Also POSTs to `/api/bot/actions` to sync button interaction configs to the server

### Bot polling

While the bot is connecting, the frontend polls `/api/bot/status` every 2 seconds to get the live gateway status and updates the UI indicator. Polling stops automatically when a terminal state (connected/error/disconnected) is reached.

---

## 9. Interaction System

**Path:** `website/src/ButtonActionsContext.tsx`, `website/src/ActionMenu.tsx`

The interaction system lets users program what happens **in Discord** when a button is clicked. This is the most powerful feature of the "bot" mode.

### Architecture

Each button's `custom_id` maps to a `ButtonAction` — an ordered array of `InteractionStep` objects. Actions are stored in `localStorage` and synced to the server when a message is sent.

### The 7 Interaction Step Types

| Step | Icon | What the bot does |
|------|------|------------------|
| `reply` | 💬 | Sends a text message reply |
| `reply_embed` | 🧩 | Sends a reply with full embedded component layout |
| `give_role` | ✅ | Assigns a Discord role to the user who clicked |
| `remove_role` | ❌ | Removes a Discord role from the user who clicked |
| `send_channel` | 📨 | Sends a message to a specified channel |
| `dm_user` | ✉️ | Opens a DM and sends a message to the user |
| `delete_message` | 🗑️ | Deletes the original message that contained the button |

Each step can be **ephemeral** (only visible to the clicking user) for `reply` and `reply_embed` types.

### Action Menu UI Flow

The `ActionMenuComponent` opens as a panel on any button with a `custom_id`. Its state machine:

```
idle
  └─ "+ Add action" → picking
        ├─ pick any type (except reply_embed) → adding [StepEditor]
        └─ pick "reply_embed" → embed-picking → adding [StepEditor]
              └─ [StepEditor: save] → idle (step added to list)

idle (with existing steps)
  └─ click step card → editing:[id] [StepEditor]
        └─ [StepEditor: save] → idle (step updated)
```

### Response Builder Modal

The `reply_embed` step has a nested builder — clicking "Design Response Layout" opens a full `<Capsule>` in a modal dialog with its own isolated Redux store. The user designs a complete component layout for the bot's reply. This means **a button click can trigger a response that itself contains buttons** — enabling multi-level interactive flows.

### Server-Side Execution

When Discord fires `INTERACTION_CREATE`:

1. Server looks up `custom_id` in `buttonActions`
2. For select menus: checks each selected value against `buttonActions`
3. Finds the `replyStep` first — sends it immediately as the interaction response (Discord requires acknowledgment within 3 seconds)
4. All other steps execute sequentially with individual error handling
5. Non-fatal step failures are logged but do not abort the chain

---

## 10. Code Generation Engine

**Path:** `website/src/Codegen.tsx`, `website/src/codegen/**/*.ejs`

The code generator turns the live component tree into production-ready code for 12+ Discord libraries.

### Engine

Templates use **EJS (Embedded JavaScript)**. Vite loads them at build time via `import.meta.glob('./codegen/**/*.ejs', { eager: true })`. Each library gets a folder under `codegen/` with a `main.ejs` entry point.

The engine:
1. User selects a library from the dropdown
2. `libComponents[libSelected]` — the compiled EJS function — is called with `{ components: state }`
3. The template recursively calls `include()` to render sub-templates per component type
4. The output string is rendered via `react-code-blocks` with the `dracula` theme

### Template Structure

Each library folder contains a template per component type:

```
codegen/discordpy/
  main.py.ejs          ← entry point, iterates top-level components
  actionrow.py.ejs     ← renders ActionRow + its children
  button.py.ejs        ← renders a Button
  selectmenu.py.ejs    ← renders a StringSelect
  container.py.ejs     ← renders a Container (recursive)
  section.py.ejs
  textdisplay.py.ejs
  mediagallery.py.ejs
  mediagallery_item.py.ejs
  thumbnail.py.ejs
  separator.py.ejs
  file.py.ejs
  emoji.py.ejs
```

This structure means adding a new library only requires creating a new folder with consistent templates — the engine auto-discovers them.

### Supported Libraries

| Key | Display Name | Language |
|-----|-------------|---------|
| `discordjs-js` | discord.js | JavaScript |
| `discordjs-ts` | discord.js | TypeScript |
| `dressed` | dressed | TypeScript |
| `discordpy` | discord.py | Python |
| `hikari` | hikari | Python |
| `pycord` | py-cord | Python |
| `jda` | JDA | Java |
| `discord-net` | Discord.Net | C# |
| `discatsharp` | DisCatSharp | C# |
| `nyxx` | nyxx | Dart |
| `dpp` | DPP | C++ |
| `itsmybot` | ItsMyBot | YAML |

---

## 11. Authentication & Security

**Path:** `server/src/index.js`

### Login Flow

1. User visits the app → `AuthGate` renders → `useAuth` calls `GET /api/auth/user`
2. If 401 → shows `<SignIn>` page
3. User enters email + password → `POST /api/auth/login`
4. Server validates against `ADMIN_EMAIL` / `ADMIN_PASSWORD` (bcrypt-hashed at startup)
5. On success → sets `req.session.user` in a signed cookie
6. All subsequent `/api/*` routes (except login/logout/user check) require a valid session

### Security Layers

| Layer | Implementation |
|-------|---------------|
| **Session** | `cookie-session` with a random `SESSION_SECRET`, `httpOnly: true`, `secure: true` in production |
| **Rate limiting** | Max 10 login attempts per IP per 15-minute window, auto-cleanup every 30 minutes |
| **Password hashing** | bcryptjs with 12 rounds |
| **Trust proxy** | `app.set('trust proxy', 1)` — correct IP detection behind Replit's reverse proxy |
| **Bot token** | Stored in `localStorage`, never sent to our server — goes directly to Discord API |
| **Secrets** | `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SESSION_SECRET` stored in Replit Secrets, never in code |

---

## 12. Internationalisation

**Path:** `website/src/i18n.ts`, `website/src/locales/`, `components-sdk/src/`

### Two-layer i18n

| Layer | Namespace | What it covers |
|-------|-----------|---------------|
| **Website** | `website` | App UI: titles, button labels, webhook/thread descriptions |
| **SDK** | `components-sdk` | Builder UI: component names, field labels, placeholder text |

### Supported Languages

`en`, `pl` (Polish), `de` (German), `es` (Spanish), `ca` (Catalan), `pt` (Portuguese), `fr` (French)

Language is auto-detected from the browser. Users can switch manually via the language switcher in the footer.

### Localised URL Paths

The code generator pages have localised URLs. `translatePath(lang, path)` in `libs.config.ts` generates them — e.g. `/pl/discordjs-generator-kodu` for Polish.

---

## 13. Design System & Pixel Decisions

OpenEmbedded deliberately mirrors Discord's own visual language — because users are building for Discord, the tool should feel native to it.

### Colour Palette

| Token | Value | Usage |
|-------|-------|-------|
| **Page background** | `#07080e` | Main app background |
| **Panel background** | `#2f3136` | Right column, inputs |
| **Surface** | `#36393f` | Preview area (Discord dark theme) |
| **Raised surface** | `#292b2f` | Cards, step list items |
| **Dark surface** | `#1c1d20` | Dropdown menus, context cards |
| **Brand blue** | `#5865F2` | Primary buttons, links, Discord accent |
| **Brand purple** | `#5758e6` | OpenEmbedded accent (loading spinner, Select highlight) |
| **Text primary** | `#dcddde` | Main body text |
| **Text secondary** | `#b4b7b9` | Subtitles, descriptions |
| **Text muted** | `#72767d` | Hints, labels |
| **Success green** | `#3ba55d` | Bot online indicator |
| **Warning yellow** | `#faa61a` | Connecting indicator |
| **Error red** | `#ed4245` | Error states |

### Typography

- **Primary font:** `gg sans` (Discord's custom font) — loaded from local `woff2` files
- **Fallback stack:** `Whitney`, `Noto Sans`, `Helvetica Neue`, `Helvetica`, `Arial`, `sans-serif`
- **Base size:** `62.5%` html (making `1rem = 10px`), then `1.4rem` body = 14px
- **Code:** monospace, rendered via `react-code-blocks` with dracula theme

### Layout Grid

- **Desktop:** `1fr 1fr` — preview left, controls right, both `position: sticky; height: 100vh`
- **Breakpoint:** `1200px` — stacks to single column
- **Right column padding:** `2rem 4rem`

### Loading Spinner

- `#292a2c` background
- `8px` solid border arc in `#5758e6`
- Faint track ring `rgba(87,88,230,0.2)`
- `0.9s linear` rotation

### Login Page

A full-page illustrated nature scene (SVG, inline) on the right half, a dark organic blob on the left with animated stars. The login card sits centered over the composition. The OpenEmbedded logo sits top-left, using `mix-blend-mode: screen` so the black padding in the PNG becomes transparent against the dark background.

---

## 14. Data Flow — End to End

### Visual Edit → Component Tree → Discord

```
User action (drag / click / type)
        │
        ▼
Capsule (SDK) detects change
        │
        ▼
StateManager.setKey / addKey / deleteKey / wrapKey
        │
        ▼
Redux dispatch → displaySlice reducer mutates state.data
        │
        ▼
React re-renders → Capsule re-renders preview in real time
        │                     │
        │                     ▼
        │             Codegen re-renders code block
        │
        ▼ (user clicks Send)
webhookImplementation.prepareRequest(state)
        │
        ├─ No files → JSON body → fetch(webhookUrl)
        └─ Files → FormData → fetch(webhookUrl)
                                    │
                                    ▼
                             Discord renders message
```

### Button Config → Bot → Discord Interaction

```
User configures step on a button
        │
        ▼
ButtonActionsContext.setAction(customId, { steps })
        │
        ▼
localStorage persisted immediately
        │
        ▼ (user sends via bot)
POST /api/bot/actions  { actions: buttonActions }
        │
        ▼
Server stores buttonActions in memory
        │
        ▼ (someone in Discord clicks button)
Discord → Gateway WebSocket → INTERACTION_CREATE
        │
        ▼
server/index.js: handleInteraction(d)
        │
        ├─ Find replyStep → POST /interactions/:id/:token/callback (type:4)
        └─ For each remaining step → execute in sequence
             give_role / remove_role / send_channel / dm_user / delete_message
```

---

## 15. File Map

```
components-sdk/src/
  Capsule.tsx               ← Root visual builder component
  CapsuleInner.tsx          ← Inner render logic
  Capsule.module.css        ← SDK styles (Discord-accurate)
  index.ts                  ← Public exports
  I18nextBackend.ts         ← SDK i18n loader
  components/               ← One file per Discord component type
    ActionRow.tsx
    Button.tsx
    StringSelect.tsx
    Section.tsx
    TextDisplay.tsx
    Thumbnail.tsx
    MediaGallery.tsx
    File.tsx
    Separator.tsx
    Container.tsx
  dnd/                      ← Custom drag-and-drop system
    DragContext.tsx
    components.tsx
    handleDragOver.ts
    handleDragDrop.ts
    boundaries.ts
    types.ts
  polyfills/                ← Host-injected interfaces
    BetterInput.ts
    EmojiPicker.ts
    ColorPicker.ts
    EmojiShow.ts
    ActionMenu.ts
    StateManager.ts
    files.ts
  utils/
    componentTypes.ts       ← All TypeScript types + parse functions
    randomGen.ts            ← Default placeholder content
    useRegenerate.ts

website/src/
  main.tsx                  ← Entry point, AuthGate, loading spinner
  App.tsx                   ← Main application layout
  App.module.css            ← Layout and shared component styles
  state.ts                  ← Redux store + all reducers + DisplaySliceManager
  responseBuilderStore.ts   ← Isolated store for Response Builder Modal
  webhook.impl.ts           ← Webhook send logic + file handling
  BotGateway.ts             ← Browser-side Discord Gateway WebSocket class
  SignIn.tsx                ← Login page
  SignIn.module.css
  Codegen.tsx               ← Code generator UI + EJS rendering
  ActionMenu.tsx            ← Button interaction configurator panel
  ActionMenu.module.css
  ButtonActionsContext.tsx  ← React context + types for interaction steps
  ResponseBuilderModal.tsx  ← Nested Capsule modal for reply_embed design
  ResponseBuilderModal.module.css
  ResponseBuilderContext.tsx
  BotChannelSelector.tsx    ← Guild + channel dropdowns
  BetterInput.tsx           ← Enhanced markdown text input
  EmojiPicker.tsx           ← Emoji mart integration
  EmojiShow.tsx             ← Inline emoji renderer
  ColorPicker.tsx           ← react-color integration
  Select.tsx                ← Shared react-select style config
  useRouter.ts              ← Page/route state manager
  useHashRouter.ts          ← Hash-based URL sync for codegen pages
  i18n.ts                   ← i18next setup
  libs.config.ts            ← Library definitions + supported languages
  index.css                 ← Global styles + font-face declarations
  slider.css                ← rc-slider overrides
  defaultJson.ts            ← Default component tree shown on first load
  codegen/
    discordpy/              ← 14 EJS templates for discord.py
    hikari/
    pycord/
    discordjs-js/
    discordjs-ts/
    dressed/
    jda/
    discord-net/
    discatsharp/
    nyxx/
    dpp/
    itsmybot/

server/src/
  index.js                  ← Express app, auth, Gateway, interaction handler

website/public/
  logo.png                  ← OpenEmbedded logo (shown top-left on login)
  favicon.png               ← Browser tab icon
  login-bg.png              ← (legacy, replaced by inline SVG)
```

---

## 16. Supported Libraries & Languages

| Library | Language | Codegen path |
|---------|---------|-------------|
| discord.js | JavaScript | `/discordjs-javascript-code-generator` |
| discord.js | TypeScript | `/discordjs-typescript-code-generator` |
| dressed | TypeScript | `/dressed-typescript-code-generator` |
| discord.py | Python | `/discordpy-python-code-generator` |
| hikari | Python | `/hikari-python-code-generator` |
| py-cord | Python | `/pycord-python-code-generator` |
| JDA | Java | `/jda-java-code-generator` |
| Discord.Net | C# | `/discord-net-csharp-code-generator` |
| DisCatSharp | C# | `/discatsharp-csharp-code-generator` |
| nyxx | Dart | `/nyxx-dart-code-generator` |
| DPP | C++ | `/dpp-code-generator` |
| ItsMyBot | YAML | `/itsmybot-code-generator` |

---

## 17. What We Are Building Next

OpenEmbedded's current foundation is solid. The vision points toward these next capabilities:

- **Undo / Redo** — the path-based state system is ready for it; just need a history stack
- **Save / Load layouts** — named presets stored server-side or in the browser
- **Shareable links** — encode the component JSON in the URL so layouts can be shared
- **Template gallery** — curated starter layouts for common bot patterns (role pickers, welcome screens, polls)
- **Multi-message builder** — design an entire interaction flow (message → reply → reply to reply)
- **Real-time Discord preview** — live iframe showing exactly how Discord renders the output
- **Team mode** — multiple users editing the same canvas via collaborative state sync
- **Plugin API** — allow community codegen templates to be submitted and loaded
- **Component validation** — real-time Discord limits enforcement (5 buttons per row, 25 select options, container nesting rules)

---

*OpenEmbedded — Build Discord. Visually.*
