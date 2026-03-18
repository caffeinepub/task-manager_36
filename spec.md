# Task Manager

## Current State
New project. No existing application files.

## Requested Changes (Diff)

### Add
- Task manager app with ability to add tasks, toggle completion, and delete tasks
- Empty state when no tasks exist
- Settings modal with theme switcher (Light, Dark, Forest Green, Royal Blue)
- Persistent task storage via backend canister

### Modify
- N/A

### Remove
- N/A

## Implementation Plan
1. Backend: Motoko canister with stable storage for tasks (add, list, toggle, delete)
2. Frontend: React UI with task form, task list, empty state, settings modal with theme options
