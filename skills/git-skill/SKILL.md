---
name: write-git-change-names
description: Generate, normalize, or review Git branch names, pull request titles, and commit messages using the project's action/scope/explanation convention. Use when Codex proposes or creates a branch, commit, or pull request; when a user asks for Git naming; or when existing branch, PR, or commit text must be checked or rewritten.
---

# Write Git Change Names

Apply one consistent vocabulary and derive every name from the actual change.

## Inspect the change

1. Inspect the task, changed files, diff, and staged diff when available.
2. Use the planned outcome for a branch name, the complete PR contents for a PR title, and only the staged change for a commit message.
3. If evidence is unavailable, infer the smallest accurate description from the user's request. State a brief assumption only when ambiguity materially affects the result.
4. Separate unrelated changes instead of hiding them behind a vague name.

## Choose the action

Use only these actions:

| Action | Use for |
| --- | --- |
| `feat` | A new user-facing or system capability or behavior |
| `fix` | A correction to incorrect or broken behavior |
| `refactor` | A logic, structure, or code change that does not add a capability or fix a bug |
| `chore` | Pipelines, build tooling, dependencies, configuration, repository maintenance, or other non-product system work |

Classify by purpose, not by how many files changed. Prefer `fix` for a bug and `feat` for new behavior even when the implementation also contains refactoring.

## Choose the scope

- Select one lowercase kebab-case scope representing the smallest primary area.
- Prefer a domain or cross-cutting concern such as `auth`, `users`, `courses`, or `questions` when it is more precise than a platform.
- Use `server` for general backend work and `client` for general frontend work.
- Use infrastructure scopes such as `mongodb`, `rabbitmq`, `ci`, `config`, `deps`, or `repo` when they are the true focus.
- Prefer `auth` for one authentication change spanning both server and client.
- Use a microservice's lowercase kebab-case name when one service owns the change.
- Never combine scopes with commas, slashes, or parentheses. Split unrelated work when one scope would be misleading.

## Write the explanation

- Summarize the concrete outcome in one concise line.
- Start with an imperative present-tense verb such as `add`, `prevent`, `extract`, `rename`, or `configure`.
- Keep the subject specific; avoid vague wording such as `make changes`, `update code`, or `various fixes`.
- Omit issue identifiers unless the user explicitly requests them.
- Use no trailing period.
- Preserve meaningful identifier and product casing in PR and commit text, such as `MongoDB`, `RabbitMQ`, or `JWT`.

## Format each name

### Branch name

Use exactly:

```text
[action]/[scope]/[explanation-separated-by-hyphens]
```

Normalize the entire branch name to lowercase ASCII kebab-case. Replace spaces and punctuation in the explanation with single hyphens. Do not add extra slash-delimited sections.

Example:

```text
feat/auth/add-refresh-token-rotation
```

### PR title and commit message

Use exactly:

```text
[action]([scope]): [explanation]
```

Keep the action and scope lowercase. Keep the explanation concise and on one line.

Example:

```text
feat(auth): add refresh token rotation
```

The PR title and commit message share the same syntax but may have different explanations: the PR summarizes the whole PR, while each commit describes its atomic staged change.

## Return names

When the user asks for the complete set, return only:

```text
Branch: feat/auth/add-refresh-token-rotation
PR title: feat(auth): add refresh token rotation
Commit message: feat(auth): add refresh token rotation
```

If distinct staged changes require multiple commits, return one commit message per atomic change and keep a single PR title that summarizes their combined outcome.

## Examples

| Change | Branch | PR title or commit message |
| --- | --- | --- |
| Add login to the application | `feat/auth/add-login-flow` | `feat(auth): add login flow` |
| Prevent duplicate form submission | `fix/client/prevent-duplicate-form-submission` | `fix(client): prevent duplicate form submission` |
| Extract user persistence behind a repository | `refactor/server/extract-user-repository` | `refactor(server): extract user repository` |
| Add backend tests to the pipeline | `chore/ci/add-backend-test-job` | `chore(ci): add backend test job` |
| Configure a RabbitMQ dead-letter exchange | `chore/rabbitmq/configure-dead-letter-exchange` | `chore(rabbitmq): configure dead-letter exchange` |

## Review existing names

Check that each existing name:

1. Uses an allowed action.
2. Uses one accurate lowercase kebab-case scope.
3. Matches the exact separators and ordering.
4. Describes the actual change rather than the work performed.
5. Is concise, specific, and free of a trailing period.

Return the corrected name and one short reason for each violated rule.
