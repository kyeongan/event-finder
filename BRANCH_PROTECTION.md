# Branch Protection Rules

This document outlines the branch protection rules and requirements for the Event Finder repository to ensure code quality and security.

## Main Branch Protection

The `main` branch is protected to ensure all changes go through proper review and testing before being merged.

### Required Protection Rules

To maintain code quality and prevent accidental pushes to main, the following branch protection rules **MUST** be enabled:

#### 1. Require Pull Request Before Merging ✅

- All changes to `main` must be made through pull requests
- Direct pushes to `main` are not allowed
- This ensures all code changes are reviewed and tracked

#### 2. Require Approvals ✅

- **At least 1 approving review** is required before merging
- Reviewers must approve the PR before it can be merged
- This ensures code quality through peer review

#### 3. Require Status Checks to Pass ✅

- All CI checks must pass before merging
- Required status checks include:
  - **Linting** (`npm run lint`)
  - **Tests** (`npm test`)
  - **Build** (`npm run build`)
- This ensures no broken code is merged

#### 4. Require Branches to be Up to Date ✅

- PRs must be updated with the latest main branch before merging
- Prevents merge conflicts and integration issues

### Optional but Recommended Rules

#### 5. Require Linear History ✅

- Enforces a linear commit history
- Prevents complex merge graphs
- Makes git history easier to understand
- **Enabled in this repository**

#### 6. Include Administrators

- Applies all branch protection rules to administrators
- Ensures everyone follows the same process
- Can be enabled for strict consistency
- **Note**: Keeping this disabled allows administrators emergency access if needed

## Setting Up Branch Protection

### Via GitHub Web Interface

1. Go to **Settings** → **Branches** in your repository
2. Click **Add rule** or edit existing rule for `main`
3. Configure the following settings:

   ```
   Branch name pattern: main

   ☑ Require a pull request before merging
     ☑ Require approvals: 1
     ☐ Dismiss stale pull request approvals when new commits are pushed (optional)
     ☐ Require review from Code Owners (optional)

   ☑ Require status checks to pass before merging
     ☑ Require branches to be up to date before merging
     Required status checks:
       - test-and-lint

   ☑ Require conversation resolution before merging
   ☑ Require linear history (recommended)
   ☐ Include administrators (optional, allows emergency access if disabled)
   ```

4. Click **Create** or **Save changes**

### Via GitHub CLI

```bash
# Enable branch protection with required reviews and status checks
gh api repos/:owner/:repo/branches/main/protection \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  --input - << EOF
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["test-and-lint"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": false
  },
  "restrictions": null
}
EOF
```

## Workflow Integration

### CI Workflow

The repository includes a CI workflow (`.github/workflows/ci.yml`) that:

- Runs on every pull request to `main`
- Executes linting, tests, and build
- Must pass before PR can be merged

### Branch Protection Check Workflow

The repository includes a branch protection check workflow (`.github/workflows/branch-protection-check.yml`) that:

- Runs daily to verify branch protection is configured
- Can be manually triggered to check current settings
- Provides instructions if protection is not enabled
- Reports detailed protection configuration

#### Manual Check

You can manually check branch protection status:

```bash
# Via GitHub CLI
gh api repos/:owner/:repo/branches/main/protection

# Via workflow dispatch
gh workflow run branch-protection-check.yml
```

## Pull Request Process

### For Contributors

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** and commit them:
   ```bash
   git add .
   git commit -m "feat: description of changes"
   ```

3. **Push your branch**:
   ```bash
   git push origin feature/your-feature-name
   ```

4. **Create a Pull Request** on GitHub:
   - Go to the repository on GitHub
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Request reviewers

5. **Address review feedback**:
   - Make requested changes
   - Push updates to the same branch
   - Respond to comments

6. **Wait for approvals**:
   - At least 1 approval is required
   - All CI checks must pass
   - Branch must be up to date with main

7. **Merge** when approved and checks pass

### For Reviewers

When reviewing pull requests:

1. **Check code quality**:
   - Code follows project conventions
   - Tests are included for new features
   - Documentation is updated if needed

2. **Verify functionality**:
   - Changes work as described
   - No breaking changes to existing features
   - Tests pass locally

3. **Provide constructive feedback**:
   - Be specific and actionable
   - Explain reasoning
   - Suggest improvements

4. **Approve or Request Changes**:
   - Approve if ready to merge
   - Request changes if issues found
   - Add comments for minor suggestions

## Enforcement

Branch protection rules are enforced automatically by GitHub. Attempts to:

- Push directly to `main` → **Rejected**
- Merge PR without approval → **Blocked**
- Merge PR with failing checks → **Blocked**
- Merge outdated PR → **Blocked**

## Checking Status

To verify branch protection is active, you can:

1. **Use GitHub Web UI**: Go to Settings → Branches
2. **Run the check workflow**: Trigger the branch protection check workflow
3. **Use GitHub CLI**: `gh api repos/:owner/:repo/branches/main/protection`

## Troubleshooting

### "Branch protection rules not met" Error

This error means one or more protection rules are not satisfied:

- **Missing approval**: Request review from a team member
- **Failing checks**: Fix the issues causing CI to fail
- **Outdated branch**: Merge latest `main` into your branch

### "Cannot merge, status checks are required"

The CI workflow must pass:

```bash
# Run locally to debug
npm run lint
npm test
npm run build
```

### "Cannot merge, approval required"

At least one team member must approve the PR:

- Request review from maintainers
- Address any feedback
- Wait for approval

## Benefits of Branch Protection

✅ **Code Quality**: Every change is reviewed and tested  
✅ **Prevent Accidents**: No accidental pushes to main  
✅ **Audit Trail**: All changes tracked through PRs  
✅ **Team Collaboration**: Promotes code review culture  
✅ **Continuous Integration**: Automated testing for all changes  

## References

- [GitHub Branch Protection Documentation](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
- [Managing a branch protection rule](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/managing-a-branch-protection-rule)
- [About status checks](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/collaborating-on-repositories-with-code-quality-features/about-status-checks)

---

**Questions?** Open an issue with the `question` label or contact the maintainers.
