#!/usr/bin/env bash
set -euo pipefail

documentation_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
workspace_root="$(cd "$documentation_root/../.." && pwd)"
shared_hooks_path="../../docs/toto/.githooks"

repositories=(
    "frontend/gaia-ui"
    "backend/gaia-after-sales"
    "backend/gaia-saas-proj"
    "mobile/gaia-after-sales-uni"
    "mobile/gaia-customer-service-uni"
)

for repository in "${repositories[@]}"; do
    repository_root="$workspace_root/$repository"
    [[ -d "$repository_root/.git" ]] || continue

    current_hooks_path="$(git -C "$repository_root" config --local --get core.hooksPath || true)"
    if [[ "$current_hooks_path" == ".husky/_" ]] \
        && grep -q 'check-doc-impact.mjs' "$repository_root/.husky/pre-commit" 2>/dev/null; then
        printf '已确认 %s 通过现有 Husky 串联 TOTO 文档影响检查。\n' "$repository"
        continue
    fi

    if [[ -n "$current_hooks_path" && "$current_hooks_path" != "$shared_hooks_path" ]]; then
        printf '跳过 %s：已有 core.hooksPath=%s，请按团队规范手动串联检查脚本。\n' \
            "$repository" "$current_hooks_path"
        continue
    fi

    git -C "$repository_root" config --local core.hooksPath "$shared_hooks_path"
    printf '已为 %s 启用 TOTO 文档影响检查。\n' "$repository"
done
