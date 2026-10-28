# Repo Mover

A zero-install browser app for managing GitHub repositories with drag and drop. It runs entirely in your browser (one HTML file, no server, no build step) and talks directly to the GitHub API.

Scope: **moving files between the repositories of one personal GitHub account.** It deliberately does not handle organizations, enterprise accounts, repo settings or renaming repositories.

- **Two panes**, each showing any repository and branch of your account.
- **Drag files or folders between panes** to copy or move them across repositories.
- **Create a folder** (＋ New folder), name it, then drag files into it. Works in either pane, so you can build the destination layout as you go.
- Also: drag within a pane to reorganise, double-click or F2 to rename a file or folder, Del to delete, Ctrl/⌘+Z to undo.
- Every change is **staged first** and applied as **one commit per repository** when you press Commit. Nothing touches GitHub until then.

Behind the scenes the app turns your drag and drop into the right Git operations (blobs, trees, commits, ref updates) through GitHub's REST API.

## Quick start

1. Open the app (see "Launching on your personal account" below).
2. Paste a GitHub token (see "Giving the app access to your repos").
3. Pick a repository in each pane, drag things around, press **Commit**.

## Launching on your personal GitHub account

You host the app yourself for free using GitHub Pages. You need a GitHub account (free is fine) and about five minutes.

1. **Create the hosting repository.** Go to <https://github.com/new>, name it (for example `repo-mover`), choose **Public**, tick "Add a README" and press **Create repository**. (Pages for private repositories needs a paid plan, so use Public. The app contains no secrets; see "Concerns" below.)
2. **Add the app.** In the new repository press **Add file → Upload files**, drag in `index.html` from this project, and press **Commit changes**. (If you forked or cloned this repository you can skip this step.)
3. **Turn on Pages.** Go to **Settings → Pages**. Under "Build and deployment" set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, and press **Save**.
4. **Wait a minute, then open** `https://<your-username>.github.io/<hosting-repo-name>/`. The first deploy can take 1 to 3 minutes; the Pages settings screen shows the address when it is ready.
5. **Bookmark it.** Your token is remembered per browser, so you only sign in once per device.

Prefer not to host anything? Double-click `index.html` to open it from your computer. It works the same way.

## Giving the app access to your repositories

The app needs a **personal access token** (PAT). The token decides exactly which repositories the app can see and change, so create it carefully.

### Recommended: fine-grained token

1. Go to <https://github.com/settings/personal-access-tokens/new>.
2. **Token name:** `Repo Mover`. **Expiration:** 30 to 90 days is a sensible choice.
3. **Resource owner:** your personal account.
4. **Repository access:** choose **Only select repositories** and pick **just the repositories you want to manage** (add the others later by editing the token). Only those appear in the app's pickers.
5. **Permissions → Repository permissions:**
   - **Contents: Read and write** (the only permission the app needs: browse, copy, move and commit files).
   - *Metadata: Read* is added automatically.
6. Press **Generate token** and copy it (it starts with `github_pat_`). GitHub shows it only once.
7. Paste it into the app's sign-in box and press **Connect**.

### Alternative: classic token

<https://github.com/settings/tokens/new?scopes=repo>: simpler, but the `repo` scope grants access to **all** your repositories, so prefer the fine-grained token.

### To add another repo later

GitHub → **Settings → Developer settings → Personal access tokens → Fine-grained tokens → Repo Mover → Repository access**, add the repository, save, then reload the app.

## Using the app

| Action | How |
| --- | --- |
| Move within a repo | Drag a file or folder onto a folder (or the root row). Hover while dragging to auto-expand folders. |
| Move to another repo (cut & paste) | Drag from one pane onto a folder in the other pane. This is the default: the file is added to the destination **and removed from the source**. |
| Copy to another repo | Hold **Shift** while dropping, or switch **Drag between panes** to *Copy*. |
| Rename | Double-click the name or press **F2**. |
| Delete | Select and press **Del**, or use the 🗑 button. |
| New folder | **＋ New folder**, type a name, press Enter, then drag files into it. (Git has no empty folders: a folder you fill with files just appears on commit; one left empty gets a `.gitkeep` placeholder file.) |
| Multi-select | Ctrl/⌘-click. |
| Undo | **↶ Undo** or Ctrl/⌘+Z. |
| Commit | **Commit** in a pane, Ctrl/⌘+Enter, or **Commit both** in the header. |

**Moving between repos is two commits:** the destination gets the files, the source loses them. **Commit both** does the destination first. If you commit only one pane, the other pane keeps its staged changes (and the app reminds you), so the file isn't gone from the source until you commit that pane too. If you commit the source first and the other commit then fails, the files exist only in your browser tab, so keep the tab open until both commits succeed.

## Concerns for newcomers (read this once)

**Your token is a password.**
- Anyone who has the token can change every repository you gave it access to. Never post it, never put it in a file, never commit it.
- The app stores it in your browser's `localStorage` and sends it only to `api.github.com`. Because it lives in the browser, **do not use the app on a shared or public computer**, and press **Sign out** when you are finished on a machine that is not yours.
- Use the shortest expiry you can tolerate and select only the repositories you need. If it leaks, revoke it at <https://github.com/settings/personal-access-tokens> straight away.

**Public hosting is not a leak, but look at what you publish.**
- GitHub Pages sites are publicly reachable. That is fine here because the page contains only the app code; your token and repository lists stay in *your* browser.
- Never add a token, or a file listing repository contents, to the hosting repository.

**Commits are real and go straight to the branch.**
- Pressing Commit writes directly to the selected branch (usually `main`). Nothing is a draft after that. There is no undo button for a commit; you would have to revert it with Git or on GitHub (**Commits → ⋯ → Revert**).
- Read the "details" list in the commit bar before committing. For anything important, switch to a throwaway branch first, or try the app on a test repository.
- Branches protected by rules (required reviews, required PRs) will refuse the commit. Use another branch, or change the rule if you own the repository.

**Moving is not the same as keeping history.**
- Moves inside one repository are recorded as renames, so history is followed. Copying or moving between repositories **creates new files in the destination with no history**; the old history stays in the source repository (or disappears from the tree there if you moved).
- GitHub's per-file size limit is 100 MB. Git LFS pointer files are copied as small text pointers, not the large files behind them, so copying LFS content between repos will not work. Submodules are skipped when copying.

**Things that look like bugs but are not.**
- A repository is missing from the picker: the token was not granted that repository, or it has expired. Edit the token.
- Repositories owned by an organization (or shared with you by someone else) are intentionally not listed; this app only shows repositories you own.
- 403 on commit: the token lacks *Contents: Read and write* for that repository.
- "422" on commit: the branch changed on GitHub since you loaded it. Reload the pane and redo the changes.
- "409 empty repository": make the first commit on github.com (even adding a README), then reload.
- Very large repositories can show a "tree truncated" warning; changes to hidden files are not possible, so use Git on your computer for those.
- API calls are rate limited (5,000 per hour with a token). Copying hundreds of files uses roughly two calls per file.

**Safe first run:** create an empty test repository, give the token access to it plus one real repository, practise copying a few files between them, then commit and check the result on github.com.

## Running the tests

`tests/e2e.js` drives the app in headless Chromium against an in-memory fake GitHub API (no network or token needed). It needs Node and Playwright:

```bash
npm install playwright
node tests/e2e.js "$PWD/index.html" /tmp/shot.png
```

## Project files

- `index.html`: the whole app.
- `HANDOFF.md`: the original design notes.
- `CHANGELOG.md`: what changed and when.
- `tests/e2e.js`: end-to-end test with a fake GitHub API.

## License

See `LICENSE`.
