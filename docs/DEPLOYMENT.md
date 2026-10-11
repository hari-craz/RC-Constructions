# RC Constructions — Deployment & Infrastructure Guide

This document is the authoritative guide for production hosting, container automation, branch protection, and release workflows.

---

## 1. Production Hosting: Vercel (Git Integration)

Production deployment is managed entirely through Vercel's native GitHub integration. Vercel automatically builds and deploys upon commits to `main`. There is no custom deployment GitHub Actions workflow and no `VERCEL_TOKEN` stored anywhere.

### Initial Setup Steps

1. Navigate to [vercel.com](https://vercel.com) and click **Add New Project**.
2. Select and import the repository: `hari-craz/RC-Constructions`.
3. Configure the Project Settings:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `./`
   - **Build Command**: `pnpm build` (configured automatically via `vercel.json`)
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
4. Configure Environment Variables:
   - `VITE_FORMSPREE_ID`: (Your production Formspree endpoint ID)
5. Set Production Branch: `main`.
6. Deploy the initial build.

### Content Security Policy (CSP) & Header Alignment

Headers are declared in `vercel.json` and mirrored exactly in `nginx.conf`:

- `default-src 'self'`: Only same-origin assets are loaded.
- `script-src 'self'`: Disallows eval and inline scripts.
- `style-src 'self'`: Fonts and stylesheets are self-hosted via `@fontsource-variable`.
- `connect-src 'self' https://formspree.io`: Restricts outbound network calls to Formspree API.
- `form-action 'self' https://formspree.io`: Allows form submission exclusively to Formspree.
- `frame-ancestors 'none'`: Prevents clickjacking framing (equivalent to `X-Frame-Options: DENY`).

> [!NOTE]
> Lenis and GSAP run locally without requiring `unsafe-eval` or external CDN access. Any future animation library relaxation must use the narrowest possible directive and be documented here.

---

## 2. GitHub Branch Protection Checklist (`main`)

In the GitHub repository settings (**Settings > Branches > Add branch protection rule** for `main`), enable:

1. **Require a pull request before merging**:
   - Require approvals: `1`
   - Dismiss stale pull request approvals when new commits are pushed: Checked
2. **Require status checks to pass before merging**:
   - Require branches to be up to date before merging: Checked
   - **Exact required status checks**:
     - `ci-pass` (the aggregate gate from `.github/workflows/ci.yml`)
     - `CodeQL Static Analysis` (from `.github/workflows/security.yml`)
     - `Dependency Audit` (from `.github/workflows/security.yml`)
     - `Gitleaks Secret Scan` (from `.github/workflows/security.yml`)
     - `Container Vulnerability Scan` (from `.github/workflows/security.yml`)
3. **Do not allow bypassing the above settings**: Checked
4. **Require linear history**: Checked
5. **Do not allow force pushes**: Checked
6. **Do not allow deletions**: Checked

---

## 3. Secrets and Variables Matrix

| Name                    | Type            | Scope          | Description                                                                                                                                            |
| :---------------------- | :-------------- | :------------- | :----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GITHUB_TOKEN`          | Built-in        | All Workflows  | Automatically provided by GitHub Actions for GHCR authentication, SARIF upload, and release-please PR creation.                                        |
| `PORTAINER_WEBHOOK_URL` | Optional Secret | Actions Secret | Webhook URL on Portainer to trigger container stack service pull and redeploy. If not configured, the docker release workflow skips this step cleanly. |

---

## 4. Repository Apps & Registry Configuration

### Renovate App Installation

1. Install the [Renovate GitHub App](https://github.com/apps/renovate) on the `hari-craz/RC-Constructions` repository.
2. Renovate will open an onboarding Pull Request based on `renovate.json`.
3. Major updates for `typescript` and `eslint` are disabled in `renovate.json` due to plugin compatibility limits.

### GHCR Package Visibility

1. When the first image is published via `.github/workflows/docker.yml`, navigate to GitHub Profile > **Packages** > `rc-constructions`.
2. Under **Package settings > Danger Zone**, set Visibility to **Public** (or keep Private if deploying with authentication).

---

## 5. Homelab & Portainer Self-Hosting

Docker images are automatically published to GitHub Container Registry (GHCR) on pushes to `main` and on version tags (`v*`).

### Build & Run via CLI

```bash
docker build --build-arg VITE_FORMSPREE_ID=your_form_id -t rc-constructions:latest .

docker pull ghcr.io/hari-craz/rc-constructions:latest

docker run -d \
  --name rc-constructions \
  --restart unless-stopped \
  -p 8080:8080 \
  --read-only \
  --tmpfs /tmp \
  --tmpfs /var/run \
  --tmpfs /var/cache/nginx \
  ghcr.io/hari-craz/rc-constructions:latest
```

### Portainer Stack (Compose)

```yaml
services:
  web:
    image: ghcr.io/hari-craz/rc-constructions:latest
    restart: unless-stopped
    ports:
      - '8080:8080'
    read_only: true
    tmpfs:
      - /tmp
      - /var/run
      - /var/cache/nginx
    security_opt:
      - no-new-privileges:true
```

- **Healthcheck Path**: `/healthz` (returns 200 `ok`)

---

## 6. Rollback Procedures

### Vercel Rollback

1. Open the Vercel Dashboard for `rc-constructions`.
2. Navigate to **Deployments**.
3. Locate the previous healthy deployment.
4. Click the three dots menu (`...`) and select **Instant Rollback**. Traffic points immediately to the previous immutable build.

### Docker / Portainer Rollback

1. Check the image history on GHCR:
   `ghcr.io/hari-craz/rc-constructions:sha-<previous-commit-sha>`
2. Redeploy the service targeting the explicit commit SHA tag or semver tag rather than `latest`:
   ```bash
   docker service update --image ghcr.io/hari-craz/rc-constructions:sha-923df65 rc-constructions
   ```
3. In Portainer, change the stack image tag to the desired SHA and click **Update the stack**.
