# HireLens — Design System

## Colors
- Background: `#0c0c0c`
- Panel/sidebar: `#161719`
- Card inner: `#161719`
- Border: `#37373f`
- Border subtle: `rgba(255,255,255,0.06)`
- Text primary: `#ffffff`
- Text secondary: `#9ca3af`
- Text muted: `#6b7280`
- Accent blue: `#1d2ba4` (primary action, active nav)
- Accent blue light: `#6ea8fe`
- Green: `#22c55e` (processed, success)
- Amber: `#f59e0b` (unprocessed, pending)
- Purple: `#818cf8` (filtered count)
- Red: `#ef4444` (error, rejected)

## Typography
- Font: Sora, sans-serif (all weights)
- Page title: 26px, weight 700, letter-spacing -0.015em
- Section header: 13–14px, weight 600
- Body: 13px, weight 400
- Label: 11–12px, weight 500, uppercase + letter-spacing for section labels

## Elevation — Double-bezel card pattern
Every major container uses nested shells:
- Outer: `background: rgba(255,255,255,0.025)`, `border: 1px solid rgba(255,255,255,0.06)`, `borderRadius: 18`, `padding: 3`
- Inner: `background: #161719`, `borderRadius: 16`, `boxShadow: inset 0 1px 0 rgba(255,255,255,0.07)`
- Small cards: outer `borderRadius: 14, padding: 2` / inner `borderRadius: 12`

## Breakpoints
- Mobile: < 768px
- Tablet: 768px – 1023px
- Desktop: ≥ 1024px

## Components
- Sidebar: 240px desktop, 64px icon-only tablet, hidden mobile (slide-in overlay)
- StatCards: 4-col desktop, 2-col tablet/mobile
- Modals: maxWidth 520px desktop, near full-screen mobile (<480px)
- Kanban: horizontal scroll, columns 300px desktop / 240px mobile
