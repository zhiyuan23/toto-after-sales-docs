#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
backend_root="$workspace_root/backend/gaia-saas-proj"
backend_build_jar="$backend_root/gaia-saas-web-jar/target/gaia-web.jar"
backend_runtime_dir="$backend_root/.local/runtime"
backend_log_dir="$backend_root/.local/logs"
mkdir -p "$backend_log_dir"
umask 077
# A named pipe preserves this shell's PID when it execs Java and lets the
# separate writer bound output throughout the JVM's lifetime.
backend_log_pipe="$backend_log_dir/.shared-backend-$$.pipe"
mkfifo "$backend_log_pipe"
node "$workspace_root/docs/toto/scripts/bounded-backend-log.mjs" "$backend_log_dir/shared-backend-$$.log" < "$backend_log_pipe" &
exec > "$backend_log_pipe" 2>&1
rm -f "$backend_log_pipe"

if [[ ! -r "$backend_root/.local/application.properties" ]]; then
    printf '%s\n' '缺少后端 .local/application.properties，请先配置本机数据库连接。' >&2
    exit 1
fi

if [[ "$(redis-cli -h 127.0.0.1 -p 16379 ping 2>/dev/null || true)" != PONG ]]; then
    printf '%s\n' '请先启动独立 Redis：redis-server --bind 127.0.0.1 --port 16379 --protected-mode yes --save "" --appendonly no' >&2
    exit 1
fi

mvn -B -f "$workspace_root/backend/gaia-sys/pom.xml" \
    -pl gaia-sys-api,gaia-sys-integrate-api,gaia-sys-open-api,gaia-log-api,gaia-sys-tools-api,gaia-sys-xcx-api \
    -am clean install -DskipTests
mvn -B -f "$workspace_root/backend/gaia-after-sales/pom.xml" -pl gaia-after-sales-api -am install -DskipTests
mvn -B -f "$backend_root/pom.xml" -pl gaia-saas-web-jar -am package -DskipTests
mkdir -p "$backend_runtime_dir"
for old_runtime_jar in "$backend_runtime_dir"/gaia-web-*.jar; do
    [[ -e "$old_runtime_jar" ]] || continue
    if ! lsof "$old_runtime_jar" >/dev/null 2>&1; then
        rm -f "$old_runtime_jar"
    fi
done
backend_runtime_jar="$backend_runtime_dir/gaia-web-$(date +%Y%m%d%H%M%S)-$$.jar"
cp "$backend_build_jar" "$backend_runtime_jar"
chmod 600 "$backend_runtime_jar"
cd "$backend_root"
exec java -jar "$backend_runtime_jar" \
    --spring.config.additional-location=file:.local/ \
    --after-sales.mobile.single-tenant-id=1001 \
    --after-sales.consumer.support.phone=400-820-9787 \
    --after-sales.consumer.support.hours='周一至周日 8:00-22:00（法定节假日除外）' \
    --after-sales.consumer.support.wechat-enabled=true
