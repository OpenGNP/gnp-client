# QA Testing — gnp-client

## Run

```
bun run test        # run once
bun run test:watch  # re-run on file change
```

## Files here

- `setup.ts` — loaded before every test file (via `vitest.config.ts`). Adds
  `@testing-library/jest-dom` matchers (e.g. `toBeInTheDocument()`).
- `projectTree.test.ts` — tests for `src/utils/projectTree.ts`, the pure
  functions that manage the Files-page folder/form tree.

## What each test covers

### `projectTree.test.ts`

**`findProjectById`**
- Finds a document nested inside a folder, by its tree node id.
- Finds a document by its `formId` (a different id from the node id — the
  tree needs both since forms and folders share a numeric id space).
- Returns `null` when nothing matches, instead of throwing.

**`findFolderById`**
- Only matches nodes of type `folder` — a document with the same id is not
  returned.

**`removeProjectById`**
- Removes a nested document and returns it as `removedProject`.
- Returns `removedProject: null` when the id isn't found, instead of
  silently mutating nothing and giving no signal.

**`removeFolderPromotingChildren`**
- When a folder is deleted, its children move up to where the folder used
  to be, rather than being deleted with it — this mirrors the server, which
  sets a form's `folder_id` to null on folder delete instead of deleting the
  form.

**`isNameTaken` / `uniqueName`**
- Name collisions are checked case-insensitively ("standalone" collides
  with "Standalone").
- Same name in a *different* folder is not a collision — collisions are
  scoped to one container.
- `uniqueName` appends `(2)`, `(3)`, … until it finds a free name.
- `uniqueName` returns the name unchanged when it's already free.
- A name that already ends in `(2)` is treated as a literal string, not
  something to bump — colliding with "Form (2)" produces "Form (2) (2)",
  not "Form (3)".
- Whitespace around a name doesn't affect the collision check.

**Empty tree**
- Every read/mutation function is checked against `[]` — none of them
  throw; they return `null`, `[]`, or an empty set as appropriate.

**`formNodeId`**
- A string id and a number id produce the same prefixed result.

**`isIdWithinItem`**
- Matches the item itself, a descendant at any depth, and correctly
  returns `false` for an id outside the subtree.

**`getDefaultOpenFolderIds`**
- Only folders explicitly flagged `open: true` are collected, at any
  nesting depth.

**`getSelectedProjectId`**
- Pulls the id out of `/forms/:id` and `/files/:id` routes, stops at the
  next path segment (so `/forms/:id/dashboard` still resolves to `:id`),
  URL-decodes the id, and returns `''` for routes matching neither prefix
  or a trailing-slash-only path.

**`getFolderPath`**
- Returns the full root-to-target chain for a nested folder, just the
  folder itself when it's already at the root, and `[]` for a document id
  or an id that doesn't exist.

**`findParentFolderId`**
- Returns `null` for a root-level item, `null` for an id that isn't found,
  and — the case most likely to regress — the *immediate* parent (not the
  top-level ancestor) for something nested two or more levels deep.

**`renameProjectById`**
- Renames a root-level or nested item without touching siblings; is a
  no-op (returns an equivalent tree) when the id isn't found.

**`addProjectToRoot`**
- Appends when no `beforeId` is given, inserts before the named sibling
  when it is, and falls back to appending when `beforeId` doesn't match
  any current sibling.

**`addProjectToFolder`**
- Adds into the named folder's children; does nothing (silently) when the
  target folder id doesn't exist.

## Why these first

These are pure functions (no DOM, no network, no state) that back the
Files-page drag/rename/delete logic — cheap to test and among the most
bug-prone code in the client (see `QA_PLAN.md` at the repo root, Section
2.2, priority 1).

## Not covered yet

Component tests (form builder, modals, routing) and e2e (drag-and-drop,
full submit flow) are later phases — see `QA_PLAN.md` Section 2.3 for the
rollout order.
