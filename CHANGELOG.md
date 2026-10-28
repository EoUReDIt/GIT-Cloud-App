# Changelog

All notable changes to this project are documented here.
Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- **Two-pane layout.** Each pane has its own repository picker, branch picker, file tree, undo history and commit bar.
- **Cross-repo drag and drop.** Dragging files or folders from one pane to the other copies them (or moves them) into the destination repo. A header setting chooses Copy or Move; holding Shift does the opposite.
- Files are transferred by fetching the blob from the source repo and re-uploading it to the destination, so binary files and file modes (e.g. executable) are preserved. Duplicate blobs are only transferred once.
- **Commit both** button: commits both panes, additions first and deletions last, so a failed commit never leaves files deleted but not yet copied.
- Smart commit messages for cross-repo copies (`Copy 3 files from owner/repo`) and deletions.
- Empty folders created in the source pane travel with a copy/move.
- The other pane automatically refreshes after a commit when it shows the same repo and branch.
- Repository rename button (`✎ Rename repo`) per pane; both panes update if they show the same repo.
- README with setup instructions for a personal account and a beginner's checklist of concerns.
- `tests/e2e.js`: headless-browser test against an in-memory fake GitHub API.

### Changed
- Repository sidebar replaced by a type-to-search picker in each pane.
- Application state refactored from a single global object into a `Pane` class.

### Fixed
- "Truncated tree" warning no longer sticks after switching repositories.
- Stale responses from a previous repo/branch can no longer overwrite the pane after you switch quickly.

## [0.1.0] - Initial single-pane version
- Single-repo browser app: drag files and folders between folders, inline rename, staged changes committed as one commit through the Git Data API, upload files from the computer, undo, new folders.
