---
name: Clear-everything Redux bug
description: The "Clear everything" button was silently broken due to a shadowed import in App.tsx.
---

**Rule:** In `website/src/App.tsx`, never redeclare `const { actions } = useButtonActions()` because it shadows the Redux `actions` import from `./state`.

**Why:** Line 69 had `const { actions: buttonActions } = useButtonActions()` (correctly renamed). A duplicate `const { actions } = useButtonActions()` at line 148 shadowed the Redux import, making every `dispatch(actions.setKey(...))` call silently do nothing (called wrong object).

**How to apply:** The fix was removing the duplicate and updating `actionsRef.current = actions` → `actionsRef.current = buttonActions`. The `actions` identifier in this file always refers to the Redux slice actions from `./state`.
