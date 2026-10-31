#!/usr/bin/env bash
# Install the project kit into a repo:  kit/install.sh <target-repo-dir> "<Project Name>"
set -euo pipefail

target="${1:?usage: install.sh <target-repo-dir> \"<Project Name>\"}"
name="${2:?usage: install.sh <target-repo-dir> \"<Project Name>\"}"
kit_dir="$(cd "$(dirname "$0")" && pwd)"

if [[ -e "$target/PROJECT" ]]; then
  echo "error: $target/PROJECT already exists" >&2
  exit 1
fi

cp -R "$kit_dir/PROJECT" "$target/PROJECT"
for f in "$target/PROJECT/project.yml" "$target/PROJECT/overview.md"; do
  esc="${name//\\/\\\\}"; esc="${esc//\//\\/}"; esc="${esc//&/\\&}"
  sed -i.bak "s/{{PROJECT_NAME}}/${esc}/g" "$f" && rm "$f.bak"
done

pointer='Follow `PROJECT/CLAUDE_PROTOCOL.md` for every session: load `PROJECT/overview.md` first and keep `PROJECT/` up to date.'
claude_md="$target/CLAUDE.md"
if ! grep -qs 'PROJECT/CLAUDE_PROTOCOL.md' "$claude_md"; then
  printf '\n## Project tracking\n\n%s\n' "$pointer" >> "$claude_md"
fi

echo "Installed into $target/PROJECT. Next:"
echo "  1. Fill in PROJECT/project.yml, overview.md and roadmap.md (or ask Claude to draft them)."
echo "  2. Add the repo to projects.json in the hub repo so the dashboard shows it."
