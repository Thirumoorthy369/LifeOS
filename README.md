# LifeOS

## Git Commands to List Files and Folders

This repository contains useful git commands to list all files and folders tracked in the repository.

### List All Tracked Files

To list all files currently tracked by git:

```bash
git ls-files
```

### List All Files with Full Path

To list all tracked files with their full paths:

```bash
git ls-tree -r HEAD --name-only
```

### List All Files and Directories (Tree View)

To see a tree structure of all tracked files and directories:

```bash
git ls-tree -r HEAD
```

### List Files in a Specific Directory

To list files in a specific directory:

```bash
git ls-files <directory-path>
```

### List All Directories

To list only top-level directories:

```bash
git ls-tree -d HEAD --name-only
```

To list all directories recursively (040000 is the git object mode for directories):

```bash
git ls-tree -r -t HEAD | grep '^040000' | cut -f2
```

### List All Files with Their Status

To see all files with their git status:

```bash
git status
```

### List All Files Including Untracked

To see status of all changed and untracked files:

```bash
git status --short
```

To list all files (tracked files followed by untracked files):

```bash
git ls-files && git ls-files --others --exclude-standard
```

Or to list only untracked files:

```bash
git ls-files --others --exclude-standard
```

### Show Repository Structure

To show a complete tree structure of the repository (requires `tree` utility - install with `brew install tree` on macOS or `apt install tree` on Ubuntu):

```bash
git ls-tree -r --name-only HEAD | tree --fromfile
```

Or use a simple alternative that works on all systems:

```bash
find . -not -path './.git/*' | sort
```

Or to list only git-tracked files in a tree-like format:

```bash
git ls-tree -r --name-only HEAD | sed 's|[^/]*/| |g'
```

### List Files Modified in Last Commit

To see files changed in the last commit:

```bash
git diff-tree --no-commit-id --name-only -r HEAD
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
