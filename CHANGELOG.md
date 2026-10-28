# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

_Nothing yet._

## [1.0.0] - 2026-10-28

Project marked **complete for personal use** by the owner (human in the loop). Not yet tested: fine-grained tokens, other users or accounts, branch-protected repositories (see README).

### Added
- **Two-pane layout.** Each pane has its own repository picker, branch picker, file tree, undo history and commit bar.
- **Cross-repo drag and drop.** Dragging files or folders from one pane to the other copies them (or moves them; Move is the default) into the destination repo. A header setting chooses Copy or Move; holding Shift does the opposite.
- Files are transferred by fetching the blob from the source repo and re-uploading it to the destination, so binary files and file modes (e.g. executable) are preserved. Duplicate blobs are only transferred once.
- **Commit both** button: commits both panes, additions first and deletions last, so a failed commit never leaves files deleted but not yet copied.
- Smart commit messages for cross-repo copies (`Copy 3 files from owner/repo`) and deletions.
- Empty folders travel with a copy/move; folders left empty on commit get a `.gitkeep`.
- The other pane automatically refreshes after a commit when it shows the same repo and branch.
- README with setup instructions for a personal account and a beginner's checklist of concerns.
- `tests/e2e.js`: headless-browser test against an in-memory fake GitHub API.

### Changed
- README: added manual test status (classic token tested by the owner; fine-grained token and other users not yet tested).
- README: added an AI-assistance disclosure (who wrote what, how it was tested, what that means for users).
- Copyright holder in `LICENSE` changed from "Melbourne" to "Kaelen" (the account owner's digital persona).
- README: new License section explaining MIT, why it suits this project, the alternatives, and licensing concerns when moving other people's files between repos.
- **Dragging between panes now defaults to Move** (cut and paste): the file is removed from the source pane when committed. Copy is one Shift-drag, or one setting, away. After committing one pane, the app reminds you if the other pane still has changes to commit.
- **Narrowed scope:** the app now only moves files between repositories of one personal account. Removed repository renaming (so the token no longer needs *Administration*), uploading files from the computer, and organization/collaborator repositories in the picker.
- **＋ New folder** creates the folder instantly and puts its name in edit mode (no pop-up), ready to drag files into, in either pane.
- Repository sidebar replaced by a type-to-search picker in each pane.
- Application state refactored from a single global object into a `Pane` class.

### Fixed
- "Truncated tree" warning no longer sticks after switching repositories.
- Stale responses from a previous repo/branch can no longer overwrite the pane after you switch quickly.

## [0.1.0] - Initial single-pane version
- Single-repo browser app: drag files and folders between folders, inline rename, staged changes committed as one commit through the Git Data API, upload files from the computer, undo, new folders.
