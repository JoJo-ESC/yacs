# 🤝 Contributing to YACS

Thanks for your interest in contributing! This guide walks you from finding work to getting your pull request merged.

## Code of Conduct
Be respectful and constructive. We want this to be a welcoming space for everyone.

## Quick Links
- Project setup: [DEVELOPMENT.md](./DEVELOPMENT.md)
- Architecture overview: [README.md](./README.md)

## Ways to Contribute
- Fix bugs or implement new features
- Improve documentation or onboarding
- Add tests and increase coverage
- Design or UX improvements

## Picking an Issue
1. Check the [GitHub Issues](https://github.com/JoJo-ESC/yacs/issues) list and look for labels like **Good First Issue**.
2. If you want to work on an unassigned issue, assign yourself and add a comment to claim it.
3. If you have a new idea, open a new issue first to discuss the scope and approach.

## Branching and Forking Workflow (Required)
We use the standard fork + pull request workflow.

1. **Fork the [repository](https://github.com/JoJo-ESC/yacs)** to your GitHub account.
2. **Clone your fork** locally.
3. **Add upstream** so you can keep your fork updated.
4. **Create a feature branch** from `main`.

Example:
```bash
git clone https://github.com/<your-username>/yacs.git
cd yacs
git remote add upstream https://github.com/JoJo-ESC/yacs.git
git checkout -b feature/short-description
```

## Keeping Your Fork Up to Date
Before you start work (and before opening your PR):
```bash
git fetch upstream
git checkout main
git merge upstream/main
git push origin main
```

## Development Setup
Follow [DEVELOPMENT.md](./DEVELOPMENT.md) to install dependencies and run the frontend/backend.

After cloning, create your local secrets file before starting the backend:
```bash
cp backend/configs/secrets.yaml.example backend/configs/secrets.yaml
```
Then open `backend/configs/secrets.yaml` and replace the `SECRET_KEY` value with a generated one:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```
This file is gitignored — never commit it.

## Coding Best Practices
- Keep PRs small and focused on a single change.
- Follow existing patterns and project structure.
- Prefer clear, readable code over clever code.
- Avoid unnecessary dependencies.
- Keep functions/modules short and cohesive.
- Add or update tests for behavior changes.
- Update documentation if behavior changes or new features are added.

## Commit Messages
Use short, descriptive messages. Examples:
- `fix: correct schedule overlap logic`
- `feat: add course search filters`
- `docs: update local setup steps`

## Testing and Quality
Before opening a PR:
- Run relevant tests locally.
- Ensure the app builds and runs.
- Fix linting/formatting issues if they exist.

If there are no tests for your area, explain how you manually verified changes in the PR description.

## Submitting a Pull Request (PR)
1. Push your branch to your fork:
   ```bash
   git push origin feature/short-description
   ```
2. Open a PR from your fork into `main` of the main repo.
3. PR Title naming convention:
   - [Feat], [Fix], [Chore], [Test], [Docs], [Style], [Refactor]
   - Title Example: `[Feat] Adding new authenication screen`
4. Fill out the PR description with:
   - What changed and why
   - How to test
   - Screenshots or GIFs for UI changes
   - Related issue link

## Review and Merge Policy
- Assign **two reviewers** before merge.
- Address all review feedback.
- Do not merge your own PR unless explicitly approved by maintainers.

## Style and Formatting
- Frontend: keep TypeScript/React code consistent with existing patterns.
- Backend: keep Python code clean and type-friendly.
- Prefer existing utilities and components over duplicating logic.

## Security and Secrets
- Do not commit secrets or credentials.
- Use environment variables for sensitive data.
- `backend/configs/secrets.yaml` is gitignored — keep your real values there, never in `secrets.yaml.example` or any committed file.
- The backend will refuse to start if `SECRET_KEY` is missing. See the Development Setup section for how to generate one.
- If you accidentally commit a secret, notify maintainers immediately and rotate it.

## Large Changes
For major changes (new features, refactors, breaking changes):
- Open an issue or discussion first.
- Describe the plan and get feedback before coding.

## Need Help?
Open a GitHub Discussion or comment on the issue you’re working on.

Thanks again for contributing!
