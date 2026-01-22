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

To list only directories:

```bash
git ls-tree -r -d HEAD --name-only
```

### List All Files with Their Status

To see all files with their git status:

```bash
git status
```

### List All Files Including Untracked

To list all files including untracked ones:

```bash
git status --short
```

### Show Repository Structure

To show a complete tree structure of the repository:

```bash
git ls-tree -r --name-only HEAD | tree --fromfile
```

Or use a simple alternative:

```bash
find . -not -path './.git/*' | sort
```

### List Files Modified in Last Commit

To see files changed in the last commit:

```bash
git diff-tree --no-commit-id --name-only -r HEAD
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
