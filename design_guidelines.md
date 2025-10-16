# Design Guidelines: Discord Developers Messaging Board

## Design Approach: Design System with Discord-Inspired Patterns

**Selected Approach**: Hybrid approach combining Material Design principles with Discord/Slack messaging patterns
**Justification**: As a developer-focused messaging platform, users expect familiar messaging UI patterns with professional polish and excellent usability.

## Core Design Elements

### A. Color Palette

**Dark Mode Primary** (default):
- Background Primary: 220 13% 13% (main canvas)
- Background Secondary: 220 13% 18% (sidebar, elevated cards)
- Background Tertiary: 220 13% 23% (input fields, hover states)
- Text Primary: 210 20% 98%
- Text Secondary: 215 20% 65%
- Border Subtle: 220 13% 28%

**Brand & Accent Colors**:
- Primary Brand: 235 86% 65% (Discord blurple-inspired)
- Primary Hover: 235 86% 60%
- Success: 142 71% 45% (online status, sent messages)
- Danger: 0 84% 60% (delete, destructive actions)
- Warning: 38 92% 50% (mentions, notifications)

**Light Mode** (optional toggle):
- Background: 0 0% 100%
- Surface: 210 20% 98%
- Text: 220 13% 13%

### B. Typography

**Font Stack**:
- Primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif
- Monospace: 'JetBrains Mono', 'Fira Code', monospace (for code snippets)

**Type Scale**:
- Display (Channel Headers): text-2xl font-semibold (24px)
- Heading (Section Titles): text-lg font-semibold (18px)
- Body (Messages): text-base (16px)
- Small (Timestamps, Metadata): text-sm (14px)
- Tiny (Status Indicators): text-xs (12px)

**Weights**: Regular (400), Medium (500), Semibold (600), Bold (700)

### C. Layout System

**Spacing Primitives**: Use Tailwind units of 1, 2, 3, 4, 6, 8, 12, 16 for consistent rhythm
- Micro spacing: p-1, p-2, gap-2 (4-8px)
- Component spacing: p-3, p-4, gap-4 (12-16px)  
- Section spacing: p-6, p-8, gap-6 (24-32px)
- Major layouts: p-12, p-16 (48-64px)

**Grid Structure**:
- Sidebar: Fixed 280px width (w-70) on desktop, collapsible on mobile
- Main Content: Flex-1 with max-w-7xl center constraint
- Message Container: max-w-4xl for optimal readability

### D. Component Library

**Navigation & Structure**:
- **App Shell**: Three-column layout (Server/Channel sidebar | Channel list | Message area)
- **Top Navigation Bar**: Fixed header with workspace name, search, user profile (h-14, bg-background-secondary)
- **Sidebar Navigation**: Channel list with icons, unread indicators, hover states
- **Channel Switcher**: Dropdown with search, create new channel button

**Core Components**:
- **Message Card**: 
  - Avatar (40px rounded-full) + Username (font-semibold) + Timestamp (text-sm text-secondary)
  - Message content with markdown support
  - Padding: p-3 with hover:bg-tertiary transition
  - Actions on hover: Edit, Delete, React (positioned absolute right-4)

- **Message Input**:
  - Floating textarea with rounded-xl border
  - Placeholder: "Message #channel-name"
  - Send button (primary brand color) and attachment button
  - Height: min-h-12, auto-grow to max-h-32

- **Channel List Item**:
  - Hash icon + Channel name + Unread badge
  - Active state: bg-primary/10 with border-l-2 border-primary
  - Hover: bg-tertiary transition-colors

**Forms & Inputs**:
- **Login Form**: Centered card (max-w-md) with logo, inputs, primary CTA button
- **Input Fields**: rounded-lg, bg-tertiary, border-transparent, focus:ring-2 focus:ring-primary
- **Buttons**: 
  - Primary: bg-primary text-white rounded-lg px-6 py-2.5 font-medium
  - Secondary: bg-tertiary text-primary border border-border
  - Ghost: hover:bg-tertiary text-secondary

**Data Display**:
- **User Profile Card**: Avatar, username, status indicator (8px rounded-full), message count
- **Timestamp Format**: Relative time (2m ago, 1h ago) with tooltip showing absolute time
- **Online Status Indicator**: 8px circle, positioned absolute on avatar
- **Unread Badge**: Rounded-full bg-primary px-2 py-0.5 text-xs

**Overlays & Modals**:
- **Modal**: Centered overlay with backdrop-blur-sm, rounded-2xl shadow-2xl
- **Dropdown Menu**: Absolute positioned, rounded-lg shadow-lg, py-2
- **Toast Notifications**: Fixed bottom-right, slide-in animation, auto-dismiss 4s

### E. Animation & Motion

**Principle**: Minimal, purposeful motion only
- Message send: Subtle fade-in (opacity 0→1, 150ms)
- Channel switch: Crossfade content (200ms ease-in-out)
- Hover states: Background color transition (150ms)
- Modal/Dropdown: Slide + fade (200ms ease-out)
- **NO decorative animations, scroll effects, or page transitions**

## Specific Screens

**Login Page**:
- Centered card design on subtle gradient background
- Discord developer branding (small logo/wordmark)
- Email/Username + Password inputs
- "Sign in to Discord Dev Board" headline
- Register link below form

**Main Messaging Interface**:
- Left Sidebar (280px): Channel list, create channel button, user profile at bottom
- Center Area: Message feed with infinite scroll, grouped by day dividers
- Message input pinned to bottom of center area
- Right Panel (optional): Thread view or user list (280px, toggleable)

**Empty States**:
- No channels: Large icon + "Create your first channel" CTA
- No messages: "No messages yet. Start the conversation!"
- Offline: "Reconnecting..." with spinner

## Technical Specifications

**Icons**: Heroicons (outline for inactive, solid for active states) via CDN
**Responsive Breakpoints**: 
- Mobile: Stack layout, hamburger menu for channels
- Tablet (md:): Two-column (channels + messages)
- Desktop (lg:): Full three-column layout

**Key Interactions**:
- Click channel → Load messages + update active state
- Type message → Auto-expand textarea, show send button
- Hover message → Show action buttons (edit/delete/react)
- @ mentions → Highlight in warning color
- Link preview → Embedded card with favicon + title

This design creates a professional, developer-friendly messaging experience that balances Discord's familiar patterns with clean, modern UI principles. The dark-first color scheme reduces eye strain during long coding sessions, while the structured layout ensures efficient navigation and communication.