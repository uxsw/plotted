# Getting Plotted running locally (Mac setup guide)

This is a step-by-step guide to get a working copy of Plotted on your machine, plus a cheat sheet of the everyday commands you'll use. Written assuming a clean Mac with nothing dev-related installed yet — skip anything you already have.

Everything below happens in **Terminal** (Applications → Utilities → Terminal, or search with Spotlight/Cmd+Space).

---

## 1. One-time setup

### Install Homebrew
Homebrew is a package manager — it makes installing dev tools on a Mac much easier. Paste this into Terminal and press enter:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

Follow any on-screen instructions (it may ask you to run one or two more commands to finish — it'll tell you exactly what to paste).

### Install Git
```
brew install git
```

### Install Node.js (via nvm)
We use `nvm` (Node Version Manager) rather than installing Node directly, so it's easy to switch versions later if needed.

```
brew install nvm
mkdir ~/.nvm
```

Then add this to your shell config — run:
```
echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.zshrc
echo '[ -s "/opt/homebrew/opt/nvm/nvm.sh" ] && \. "/opt/homebrew/opt/nvm/nvm.sh"' >> ~/.zshrc
```

Close and reopen Terminal, then install Node:
```
nvm install --lts
nvm use --lts
```

Check it worked:
```
node -v
npm -v
```
Both should print a version number.

### Install a code editor
[VS Code](https://code.visualstudio.com/) is what most people use — download and install like any Mac app.

### GitHub access
You'll need a GitHub account, and John will need to add you as a collaborator on `uxsw/plotted` (or set you up with appropriate access). Once that's done:

```
git config --global user.name "Natalie [Surname]"
git config --global user.email "your-email@example.com"
```

---

## 2. Getting the project

### Clone the repository
Pick a folder where you want the project to live (e.g. `~/Projects`), then in Terminal:

```
cd ~/Projects
git clone https://github.com/uxsw/plotted.git
cd plotted
```

### Install dependencies
```
npm install
```
This reads the project's package list and downloads everything it needs. Can take a minute or two.

### Environment variables
Plotted needs some secret keys (Supabase, Anthropic API) to run locally — these aren't stored in the repo for security reasons. **John will need to share a `.env.local` file with you separately** (not over Slack/email in plain text — ask him how he'd like to share it). Once you have it, drop it directly into the root of the `plotted` folder.

---

## 3. Running the app locally

```
npm run dev
```

Then open **http://localhost:3000** in your browser. Leave the Terminal window running in the background — that's the local server. `Ctrl + C` in Terminal stops it.

---

## Git cheat sheet

A few concepts first, since these terms come up constantly:
- **Branch** — a separate working copy of the code, so you can make changes without affecting the main version until they're reviewed.
- **Commit** — a saved snapshot of your changes, with a short message describing what changed.
- **Push** — sends your commits up to GitHub.
- **Pull** — brings down changes other people have made.

| What you want to do | Command |
|---|---|
| Check what's changed / current branch | `git status` |
| Get the latest changes from GitHub | `git pull` |
| Create a new branch and switch to it | `git checkout -b your-branch-name` |
| Switch to an existing branch | `git checkout branch-name` |
| See all branches | `git branch` |
| Stage your changes for commit | `git add .` |
| Commit staged changes with a message | `git commit -m "short description of change"` |
| Push your branch to GitHub | `git push` (first time on a new branch: `git push -u origin your-branch-name`) |
| See recent commit history | `git log --oneline -10` |

### A typical day's workflow
```
git checkout main
git pull                        # make sure you're up to date
git checkout -b my-new-branch   # start a new piece of work
# ...make your changes...
git add .
git commit -m "Update onboarding copy"
git push -u origin my-new-branch
```
Then open a **pull request** on GitHub (there'll be a prompt to do this right after pushing) so John can review before it merges into the main version.

---

## Troubleshooting

- **"command not found: git"** — Terminal needs restarting after Homebrew install, or run `xcode-select --install` (Mac's developer tools, may prompt separately).
- **`npm install` fails** — double check `node -v` shows a version (if not, `nvm use --lts` again) and try `npm install` again.
- **Port 3000 already in use** — something else is already running on that port; quit other Terminal windows running `npm run dev`, or restart your Mac.
- **Anything else** — send John (or me) the exact error message from Terminal; it's almost always searchable or a quick fix.
