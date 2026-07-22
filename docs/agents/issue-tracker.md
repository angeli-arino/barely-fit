# Issue tracker: GitHub

Issues and PRDs live as GitHub issues in `angeli-arino/barely-fit`. Use the `gh` CLI for issue operations.

## Conventions

- Create one GitHub issue per ticket.
- Publish blockers before blocked tickets.
- Use GitHub's native issue dependencies where available.
- Fall back to a `Blocked by: #...` line when native dependencies are unavailable.
- Apply `ready-for-agent` to implementation-ready tickets.
- Pull requests are not treated as incoming feature requests.
- Never close or modify a parent issue unless explicitly requested.

GitHub shares one number space across issues and pull requests. Resolve an ambiguous number by checking the pull request first and then the issue.

## Operations

- Create: `gh issue create --title "..." --body "..."`
- Read: `gh issue view <number> --comments`
- List: `gh issue list --state open`
- Comment: `gh issue comment <number> --body "..."`
- Label: `gh issue edit <number> --add-label "..."`
- Close: `gh issue close <number> --comment "..."`

Infer the repository from the configured Git remote when commands run inside this repository.
