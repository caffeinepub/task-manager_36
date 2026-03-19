# Task Manager

## Current State
The workspace is empty (previous deployments were made but files are no longer present). The app is a task manager with:
- Add/complete/delete tasks
- localStorage persistence
- Settings modal with theme switching
- Service worker for offline/online support
- Online/offline indicator

## Requested Changes (Diff)

### Add
- `bg-slate-950` dark background matching Daily Focus app
- Settings Theme Color picker with 5 circular color swatches: Cyan, Purple, Emerald, Rose, Amber (matching Daily Focus exactly)
- Frosted glass card effect for main container on desktop

### Modify
- Replace previous theme buttons (Light/Dark/Forest Green/Royal Blue) with new Daily Focus-style color swatches
- Update all UI colors to use slate-950 dark base with selected accent color

### Remove
- Old Light/Dark/Forest Green/Royal Blue theme options

## Implementation Plan
1. Recreate the full task manager as a React app
2. Use bg-slate-950 as base background (matches Daily Focus)
3. Settings modal with circular color buttons: Cyan (#06b6d4), Purple (#a855f7), Emerald (#10b981), Rose (#f43f5e), Amber (#f59e0b)
4. Selected theme color applies to: add button, checkboxes, focus rings, accents
5. Tasks: add, mark complete (strikethrough), delete
6. localStorage persistence under key 'tasks'
7. Service worker for offline caching
8. Online/offline status indicator
