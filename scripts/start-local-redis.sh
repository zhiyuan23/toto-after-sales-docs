#!/usr/bin/env bash
set -euo pipefail
workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
log_dir="$workspace_root/backend/gaia-saas-proj/.local/logs"
umask 077
mkdir -p "$log_dir"
pipe="$log_dir/.shared-redis-$$.pipe"
mkfifo "$pipe"
node "$workspace_root/docs/toto/scripts/bounded-backend-log.mjs" "$log_dir/shared-redis.log" < "$pipe" &
exec > "$pipe" 2>&1
rm -f "$pipe"
cd "$workspace_root"
exec redis-server --bind 127.0.0.1 --port 16379 --protected-mode yes --save '' --appendonly no \
    --pidfile "$workspace_root/backend/gaia-saas-proj/.local/runtime/shared-redis.pid"
