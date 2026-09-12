#!/usr/bin/env bash

set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
default_workspace_root="$(cd "$script_dir/../../.." && pwd)"
workspace_root="${TOTO_WORKSPACE_ROOT:-$default_workspace_root}"
work_branch="${TOTO_WORK_BRANCH:-feature/20260907_蓝鲸售后服务_志远_喆宇}"
missing_required_repo=0

info() {
  printf '[TOTO] %s\n' "$1"
}

warn() {
  printf '[TOTO] 注意：%s\n' "$1" >&2
}

ensure_repo() {
  local name="$1"
  local relative_path="$2"
  local repo_url="$3"
  local branch="$4"
  local target="$workspace_root/$relative_path"

  if [[ -d "$target/.git" ]] || git -C "$target" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    local current_branch
    current_branch="$(git -C "$target" branch --show-current 2>/dev/null || true)"
    info "$name 已存在：${relative_path}（当前分支：${current_branch:-detached HEAD}），跳过。"
    return
  fi

  if [[ -e "$target" ]]; then
    warn "$relative_path 已存在但不是 Git 仓库，请先人工确认该目录。"
    return 1
  fi

  mkdir -p "$(dirname "$target")"
  info "正在拉取 $name → $relative_path"
  git clone --branch "$branch" "$repo_url" "$target"
}

info "工作区根目录：$workspace_root"
info "业务开发分支：$work_branch"

ensure_repo \
  "售后后端" \
  "backend/gaia-after-sales" \
  "https://codeup.aliyun.com/ehsure/gaia/gaia-after-sales.git" \
  "$work_branch"

ensure_repo \
  "Gaia 聚合运行宿主（TOTO 独立检出）" \
  "backend/gaia-saas-proj" \
  "https://codeup.aliyun.com/ehsure/gaia/gaia-saas-proj.git" \
  "$work_branch"

ensure_repo \
  "Web 管理端" \
  "frontend/gaia-ui" \
  "https://codeup.aliyun.com/ehsure/gaia/gaia-ui.git" \
  "$work_branch"

after_sales_uni_target="$workspace_root/mobile/gaia-after-sales-uni"
if [[ -d "$after_sales_uni_target/.git" ]] || git -C "$after_sales_uni_target" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  info "消费者小程序已存在：mobile/gaia-after-sales-uni，跳过。"
elif [[ -n "${TOTO_AFTER_SALES_UNI_REPO_URL:-}" ]]; then
  ensure_repo \
    "消费者小程序" \
    "mobile/gaia-after-sales-uni" \
    "$TOTO_AFTER_SALES_UNI_REPO_URL" \
    "${TOTO_AFTER_SALES_UNI_BRANCH:-main}"
else
  warn "gaia-after-sales-uni 当前没有已确认的远程地址。拿到地址后设置 TOTO_AFTER_SALES_UNI_REPO_URL 再运行本脚本。"
  missing_required_repo=1
fi

info "gaia-customer-service-uni 尚未建仓，当前不自动创建。"

printf '\n'
info "已完成可用仓库检查与拉取。脚本不会自动 pull、切换已有仓库分支或覆盖本地修改。"
info "项目入口：$workspace_root/docs/toto/README.md"
info "售后 Web 全栈启动：cd \"$workspace_root/frontend/gaia-ui\" && yarn dev:afs"

if [[ "$missing_required_repo" -eq 1 ]]; then
  exit 2
fi
