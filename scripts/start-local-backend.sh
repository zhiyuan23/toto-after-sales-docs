#!/usr/bin/env bash
set -euo pipefail

workspace_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
backend_root="$workspace_root/backend/gaia-saas-proj"

if [[ ! -r "$backend_root/.local/application.properties" ]]; then
    printf '%s\n' '缺少后端 .local/application.properties，请先配置本机数据库连接。' >&2
    exit 1
fi

if [[ "$(redis-cli -h 127.0.0.1 -p 16379 ping 2>/dev/null || true)" != PONG ]]; then
    printf '%s\n' '请先启动独立 Redis：redis-server --bind 127.0.0.1 --port 16379 --protected-mode yes --save "" --appendonly no' >&2
    exit 1
fi

mvn -B -f "$workspace_root/backend/gaia-after-sales/pom.xml" -pl gaia-after-sales-api -am install -DskipTests
mvn -B -f "$backend_root/pom.xml" -pl gaia-saas-web-jar -am package -DskipTests
cd "$backend_root"
exec java -jar gaia-saas-web-jar/target/gaia-web.jar --spring.config.additional-location=file:.local/
