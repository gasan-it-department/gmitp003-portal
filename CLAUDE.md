# gmitp003-v2 — READ FIRST, EVERY SESSION

## ⛔ Run the dev server ONLY from THIS main checkout — never from a worktree

The user's real, current frontend work lives **here** (`gmitp003-v2` root, on `main`),
often as **uncommitted** changes. The git worktrees under `.claude/worktrees/*` are
branched BEHIND `main` and do **not** contain the uncommitted work — running from them
serves the **OLD design with features missing**. This has wasted the user's time and
money repeatedly. Do not let it happen again.

**Before starting/serving the frontend, ALWAYS:**
1. `cd` to `C:\Users\vincent\Desktop\gasan_municipal_project\gmitp003-v2` (this dir).
2. Confirm `git rev-parse --abbrev-ref HEAD` is `main` and `git log HEAD..main` is empty.
3. `npm run dev` from here (port 5173). If a stale vite is already on 5173, kill it and
   clear `node_modules/.vite` first, then tell the user to hard-refresh (Ctrl+Shift+R).

**Never** launch `npm run dev` from `.claude/worktrees/...`. If the user reports "old
version / old layout / features missing," the cause is almost always that the server
was started from a worktree — switch it to this checkout, don't rebuild anything.

Backend is a separate repo: `..\gmitp003-api` (port 3000) — edit and run it there.

See also the memory note `worktree-behind-main`.
