# Git Workflow Guide (This Repo)

This repo uses a simple, safe workflow:

- Do all work on `Dash1` (your working branch).
- When you are happy, merge `Dash1` into `main`.
- Push to GitHub often (so nothing is lost).

All commands below are written for PowerShell on Windows.

## 1) One-Time Setup (Only Once Per PC)

### Install Git
- Install Git for Windows (if not installed).

### Set your identity (global)
```powershell
git config --global user.name "Your Name"
git config --global user.email "you@example.com"
```

### Optional quality-of-life settings
```powershell
# Use main as default branch name for new repos
git config --global init.defaultBranch main

# Use a helpful default editor (VS Code)
git config --global core.editor "code --wait"

# Normalize line endings on Windows (recommended)
git config --global core.autocrlf true
```

## 2) Everyday Workflow (Change -> Commit -> Push)

### Step A: Make sure you are on Dash1
```powershell
git branch
git status
```
If you are not on `Dash1`:
```powershell
git checkout Dash1
```

### Step B: Pull latest remote changes (recommended before you start)
```powershell
git pull
```

### Step C: Make code changes
Edit files normally in your editor.

### Step D: See what changed
```powershell
git status
git diff
```
See changes for a specific file:
```powershell
git diff -- backend/main.py
```

### Step E: Stage changes (choose what goes into the commit)
Stage specific files:
```powershell
git add backend/main.py TodoList.md
```
Stage everything:
```powershell
git add .
```
Review what is staged:
```powershell
git diff --staged
```

### Step F: Commit
```powershell
git commit -m "Short message describing the change"
```

### Step G: Push to GitHub (backup/share)
```powershell
git push
```
If Git says upstream is not set (first push of a new branch):
```powershell
git push -u origin Dash1
```

## 3) When You Like the Changes: Merge Dash1 -> main

This is how you promote tested/approved changes to `main`.

### Step A: Update main from GitHub
```powershell
git checkout main
git pull
```

### Step B: Merge Dash1 into main
```powershell
git merge Dash1
```

### Step C: Push main
```powershell
git push
```

### Step D: Go back to Dash1
```powershell
git checkout Dash1
```

## 4) Handling Merge Conflicts (Common and Normal)

If a merge or pull shows a conflict:

1. Check which files conflict:
```powershell
git status
```

2. Open the conflicted files and look for markers:
```text
<<<<<<<
=======
>>>>>>>
```

3. Edit the file to keep the correct final content (remove markers).

4. Mark conflicts resolved and complete the merge:
```powershell
git add path/to/conflicted-file
git commit
```

If you want to stop and undo the merge attempt:
```powershell
git merge --abort
```

## 5) Undo / Fix Mistakes (Very Useful)

### Discard local changes in a file (not committed)
```powershell
git restore backend/main.py
```

### Unstage a file (keep changes, just remove from staging)
```powershell
git restore --staged backend/main.py
```

### Change the last commit message (only if NOT pushed)
```powershell
git commit --amend -m "New message"
```

### Undo the last commit but keep the code changes (only local)
```powershell
git reset --soft HEAD~1
```

### Undo the last commit and discard changes (dangerous)
Only do this if you are 100% sure and it was not pushed.
```powershell
git reset --hard HEAD~1
```

## 6) Create a New Feature Branch (Optional)

If you want to separate work (recommended for big features):
```powershell
git checkout Dash1
git pull
git checkout -b feature/my-feature
```
Push it:
```powershell
git push -u origin feature/my-feature
```
Merge into Dash1 when ready:
```powershell
git checkout Dash1
git merge feature/my-feature
git push
```

## 7) Useful Commands (Quick Reference)

```powershell
# See branches
git branch
git branch -r

# Recent commits
git log --oneline --decorate --graph -n 15

# What changed
git status
git diff
git diff --staged

# Remote info
git remote -v
```

## 8) Repo Safety Notes (Important)

- Do not commit secrets (API keys, passwords, tokens). Put them in `.env` and ensure `.env` is ignored.
- Do not commit large generated files (like `uploads/`, `node_modules/`, `.venv/`). This repo already ignores common ones.
- If you accidentally committed a secret, treat it as exposed and rotate it immediately.

