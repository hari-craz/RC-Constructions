# RC Constructions — Production Launch Checklist

This document is the manual release manual. Follow each step in sequence with the exact commands and UI pathways.

---

## 1. Push `main` to Remote Repository

Push the completed Phase 1 through Phase 5 code to GitHub:

```bash
git push origin main
```

---

## 2. Open Verification Pull Request to Exercise CI

To verify end-to-end GitHub Actions automation on a pull request:

1. Create a validation branch:
   ```bash
   git checkout -b test/ci-verification
   git commit --allow-empty -m "chore: test CI pipeline gates"
   git push -u origin test/ci-verification
   ```
2. Navigate to GitHub: **Pull requests > New pull request**.
3. Select `base: main` ← `compare: test/ci-verification`.
4. Click **Create pull request** with title: `chore: test CI pipeline gates`.
5. Observe the CI workflow run. Ensure the following parallel jobs run and complete:
   - `Lint & Style`
   - `Typecheck`
   - `Vitest Unit Tests`
   - `Knip Dead Code Audit`
   - `Production Build`
   - `Playwright E2E Tests`
   - `Docker Smoke Test`
   - **`ci-pass` (aggregate gate)** goes green.
6. Once green, close or merge the PR and return to `main`:
   ```bash
   git checkout main
   git branch -D test/ci-verification
   git push origin --delete test/ci-verification
   ```

---

## 3. Configure GitHub Branch Protection for `main`

Navigate to **GitHub Repository > Settings > Branches**:

1. Click **Add branch protection rule** (or edit rule for `main`).
2. Set **Branch name pattern**: `main`.
3. Check **Require a pull request before merging**:
   - Required approvals: `1`.
   - Check **Dismiss stale pull request approvals when new commits are pushed**.
4. Check **Require status checks to pass before merging**:
   - Check **Require branches to be up to date before merging**.
   - In the search box, search for and select each of the **5 exact required status checks**:
     - `ci-pass`
     - `CodeQL Static Analysis`
     - `Dependency Audit`
     - `Gitleaks Secret Scan`
     - `Container Vulnerability Scan`
5. Check **Do not allow bypassing the above settings**.
6. Check **Require linear history**.
7. Check **Do not allow force pushes**.
8. Check **Do not allow deletions**.
9. Click **Save changes**.

---

## 4. Import Project on Vercel

1. Log into your Vercel Dashboard at [vercel.com](https://vercel.com).
2. Click **Add New... > Project**.
3. Under **Import Git Repository**, select `RC-Constructions`.
4. In the **Configure Project** screen:
   - **Project Name**: `rc-constructions`
   - **Framework Preset**: `Vite` (detected automatically)
   - **Root Directory**: `./` (detected automatically)
   - **Build Command**: `pnpm build`
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`
5. Expand **Environment Variables**:
   - Key: `VITE_FORMSPREE_ID`
   - Value: `<your-formspree-form-id>` (or placeholder value for staging)
6. Ensure **Production Branch** is set to `main`.
7. Click **Deploy**.
8. Once deployment succeeds, verify response headers via CLI:
   ```bash
   curl -I https://<your-vercel-domain>.vercel.app/
   ```
   Confirm `Content-Security-Policy`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and `X-Content-Type-Options: nosniff` are present.

---

## 5. Install the Renovate GitHub App

1. Visit the Renovate app page at [github.com/apps/renovate](https://github.com/apps/renovate).
2. Click **Configure** and choose your personal account / organization.
3. Select **Only select repositories** and pick `RC-Constructions`.
4. Click **Save**.
5. Within 5 minutes, Renovate will create a "Configure Renovate" PR confirming dependency tracking with TypeScript (~5.8) and ESLint (^9) major bump pinning. Review and merge the PR.

---

## 6. Run Docker Release Workflow & Configure GHCR Visibility

1. On GitHub, navigate to **Actions > Docker Release**.
2. If triggering manually or upon push to `main`:
   - The workflow runs `.github/workflows/docker.yml`.
   - Multi-arch images are built (`linux/amd64`, `linux/arm64`) and pushed to GitHub Container Registry:
     `ghcr.io/<your-github-username>/rc-constructions:latest`
3. Configure GHCR package visibility:
   - Navigate to your GitHub profile / organization **Packages** tab.
   - Click package `rc-constructions`.
   - Click **Package settings** (bottom right of sidebar).
   - Under **Danger Zone > Change visibility**, select **Public** (or keep Private if internal).
4. Verify by pulling and running the container locally:
   ```bash
   docker pull ghcr.io/<your-github-username>/rc-constructions:latest
   docker run --rm -d -p 8080:8080 --name rc-smoke ghcr.io/<your-github-username>/rc-constructions:latest
   ```
5. Test container endpoints:
   ```bash
   curl http://localhost:8080/healthz
   # Expected output: OK
   ```
6. Stop container:
   ```bash
   docker stop rc-smoke
   ```

---

## 7. Portainer / Self-Hosted Production Deployment

1. In Portainer, navigate to **Stacks > Add stack**.
2. Name the stack: `rc-constructions`.
3. Paste the contents of `docker-compose.yml`:
   ```yaml
   services:
     web:
       build:
         context: .
         dockerfile: Dockerfile
         args:
           VITE_FORMSPREE_ID: ${VITE_FORMSPREE_ID:-mock-formspree-id}
       image: rc-constructions:latest
       container_name: rc-constructions-app
       restart: unless-stopped
       read_only: true
       tmpfs:
         - /var/cache/nginx:rw,noexec,nosuid,size=16m
         - /var/run:rw,noexec,nosuid,size=4m
       environment:
         - VITE_FORMSPREE_ID=${VITE_FORMSPREE_ID}
       ports:
         - '8080:8080'
       healthcheck:
         test: ['CMD', 'wget', '--spider', '-q', 'http://127.0.0.1:8080/healthz']
         interval: 30s
         timeout: 5s
         retries: 3
         start_period: 5s
   ```
4. Under **Environment variables**, set `VITE_FORMSPREE_ID` to the verified Formspree form ID.
5. Click **Deploy the stack**.
6. Verify the container shows **healthy** status in Portainer.

---

## 8. Final Live Edge Verification

Run the verification suite against your deployed production URL:

```bash
# 1. Verify HTTP headers and security policy
curl -I https://<your-production-domain>/

# 2. Verify 404 handler returns status 404 and custom template
curl -i https://<your-production-domain>/nonexistent-path-test

# 3. Verify static SEO files
curl -s https://<your-production-domain>/robots.txt
curl -s https://<your-production-domain>/sitemap.xml

# 4. Verify Open Graph and Favicon assets
curl -I https://<your-production-domain>/og-image.png
curl -I https://<your-production-domain>/apple-touch-icon.png
curl -I https://<your-production-domain>/site.webmanifest
```

---

## 8a. Pre-launch content, form and domain (Phase 13)

- [ ] Replace the sample phone, email, address and hours (`docs/BEFORE-GOING-LIVE.md` section 0).
- [ ] Set `VITE_FORMSPREE_ID` in Vercel (Production), redeploy, set Formspree's allowed domain, test once yourself (`docs/FORM-AND-DOMAIN.md`).
- [ ] Final domain and DNS; `src/config/site.json` and the `vercel.json` CORS origin match.
- [ ] SPF, DKIM, DMARC for the company mail provider.
- [ ] Adviser has read `/privacy` and `/terms`.
- [ ] `node scripts/check-live.mjs https://<live host>` reports no failures (headers, no wildcard CORS, canonical URL, security.txt expiry, clean console).

## 9. Release Automation (`v0.1.0`)

1. Once `main` is stable, the `release-please` action will open a Release PR (`chore: release v0.1.0`).
2. Review the generated `CHANGELOG.md` entry.
3. Merge the Release PR into `main`.
4. Release Please will automatically tag `v0.1.0` and create the GitHub Release.
