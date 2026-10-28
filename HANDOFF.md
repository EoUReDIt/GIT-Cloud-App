# Handoff: Repo Mover (browser app for managing a GitHub repo)

## Goal
Personal, single-user, zero-install browser app that mirrors managing a GitHub repo.
Priorities: (1) drag files/folders between folders, (2) easy rename of the repo and of folders.
Host free on GitHub Pages. No backend, no build step.

## Current state
`index.html` (single file, vanilla JS, no dependencies) was written but **never run or tested**
(no Node on the desktop machine; browser pane could not open the file). First job: open it, fix bugs.

## How it works
- Auth: user pastes a GitHub personal access token (fine-grained: Contents RW + Administration RW;
  or classic `repo` scope). Stored in localStorage key `rm_token`; sent only to api.github.com.
- Lists repos via `GET /user/repos`; selects a repo and branch.
- Loads the tree: `git/ref/heads/<branch>` -> commit -> `git/trees/<treeSha>?recursive=1`.
- All edits are **staged client-side** (state `S.files`, `S.virt`, undo stack) and committed at once:
  `POST git/blobs` (new files) -> `POST git/trees` with `base_tree` (moves = old path `sha:null` + new path
  with old sha) -> `POST git/commits` -> `PATCH git/refs/heads/<branch>`.
- Folders are derived from file paths. Empty "new folders" are virtual until commit, then get a `.gitkeep`.
- Folder rename/move = prefix remap of every file path under it.
- Repo rename: `PATCH /repos/{owner}/{repo}` with `{name}`.
- UI: drag/drop via HTML5 DnD (internal mime `application/x-paths`; OS files -> upload),
  F2 / double-click / pencil to rename, Del to delete, Ctrl+Z undo, Ctrl+Enter commit,
  Ctrl/Cmd-click multi-select, hover-while-dragging auto-expands folders.

## Things to verify first
1. Page loads with no console errors; token login works.
2. Drag file -> folder, folder -> folder, folder -> root; moving a folder into itself is refused.
3. Inline rename of file, folder, and repo; name collisions are refused.
4. Commit produces one commit with correct renames (check `git log --stat` / GitHub UI).
5. Empty-blob creation for `.gitkeep` (`content: ''`); fallback to `"\n"` is coded but untested.
6. Dragging a row while re-render happens (expand uses partial DOM update to avoid cancelling the drag).

## Known limits / ideas
- Files > 25 MB skipped; dropping whole folders from the OS unsupported (files only).
- Truncated trees (huge repos) only show a warning.
- Commit fails with 422 if the branch moved remotely; user must reload.
- Possible next features: file preview/edit, new repo, move across repos, multi-commit history view,
  mobile touch drag support (HTML5 DnD is poor on touch; consider tap-to-select + "move here").

## Deploy
Repo -> Settings -> Pages -> Deploy from branch `main` / root -> `https://<user>.github.io/<repo>/`.
