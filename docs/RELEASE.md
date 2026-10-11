# RC Constructions — Release & Versioning Guide (`docs/RELEASE.md`)

This document outlines the automated release, tagging, and changelog generation workflow for RC Constructions using Google's **Release Please** action.

---

## 1. Conventional Commits Standard

All commits merged into `main` must strictly adhere to the [Conventional Commits](https://www.conventionalcommits.org/) specification. Husky and Commitlint enforce this standard automatically on local commits.

### Commit Format

```text
<type>(<scope>): <short description>
```

### Supported Types

- **`feat`**: Introduces a new feature (triggers a `minor` release, e.g. `0.1.0` -> `0.2.0`).
- **`fix`**: Fixes a defect or bug (triggers a `patch` release, e.g. `0.1.0` -> `0.1.1`).
- **`perf`**: Performance improvement (triggers a `patch` release).
- **`docs`**: Documentation changes only (does not bump version).
- **`chore`**: Maintenance, build configs, dependencies (does not bump version).
- **`refactor`**: Code restructuring without visual or functional change.

### Example Commits

```bash
git commit -m "feat(projects): add architectural record drawings gallery"
git commit -m "fix(cursor): resolve touch device fine-pointer detection"
git commit -m "perf(images): compress WebP portrait asset"
```

---

## 2. Automated Release Workflow (`release-please.yml`)

1. **Pull Request Merged to `main`**:
   - Each time a PR or commit lands on `main`, the `.github/workflows/release-please.yml` workflow executes.
2. **Release PR Creation**:
   - Release Please analyzes commit messages since the last release tag.
   - It automatically generates or updates a dedicated Release Pull Request titled `chore: release vX.Y.Z`.
   - It updates `CHANGELOG.md` with structured release notes (Features, Bug Fixes, Performance Improvements).
   - It bumps the version in `package.json` and `.release-please-manifest.json`.
3. **Merging the Release PR**:
   - When the release is ready for publication, review and merge the Release Pull Request.
4. **Tag & GitHub Release Publication**:
   - Upon merge, Release Please automatically creates a git tag (e.g. `v0.1.0`) and publishes a GitHub Release.
5. **Docker Multi-Arch Image Publish**:
   - The `.github/workflows/docker.yml` pipeline triggers upon tag creation (`v*`), builds multi-platform Docker images (`linux/amd64`, `linux/arm64`), and publishes them to GitHub Container Registry (`ghcr.io/hari-craz/rc-constructions:vX.Y.Z`).

---

## 3. Configuration Files

- `release-please-config.json`: Declares package release strategy (`node`), changelog path (`CHANGELOG.md`), and pre-major version rules (`bump-minor-pre-major: true`).
- `.release-please-manifest.json`: Tracks the current published version (`0.1.0`).
- `.github/workflows/release-please.yml`: GitHub Actions runner configuration.
