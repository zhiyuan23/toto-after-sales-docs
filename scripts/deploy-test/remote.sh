#!/usr/bin/env bash
set -Eeuo pipefail
umask 077
RELEASE=${1:?release ID required}
[[ "$RELEASE" =~ ^[0-9]{14}-[a-f0-9]{8}$ ]] || exit 64
BASE=/yundata/saas_test
CATALINA="$BASE/tomcat11"
WEB="$CATALINA/webapps"
STAGE="$BASE/packages/$RELEASE"
BACKUP="$BASE/backups/$RELEASE"
HELPER="$STAGE/support.py"
started=0

status() { python3 "$HELPER" status "$STAGE" "$@"; }
pids() {
  ps -eo pid=,args= | awk '$0 ~ /-Dcatalina.base=\/yundata\/saas_test\/tomcat11( |$)/ && $0 ~ /org.apache.catalina.startup.Bootstrap start/ {print $1}'
}
stop_process() {
  local pid="$1"
  kill -TERM "$pid"
  local i
  for ((i=0;i<120;i++)); do
    kill -0 "$pid" 2>/dev/null || return 0
    sleep 1
  done
  return 1
}
restart() {
  # The JVM must not inherit the deployment lock and retain it after this script exits.
  "$CATALINA/bin/startup.sh" 9>&- >"$STAGE/startup.log" 2>&1 || return 1
  python3 "$HELPER" wait-http 420 http://127.0.0.1:8011
}
rollback() {
  local code="$1" pid
  trap - ERR INT TERM
  set +e
  if [[ "$started" == 1 ]]; then
    status ROLLING_BACK
    while read -r pid; do
      [[ -n "$pid" ]] || continue
      if ! stop_process "$pid"; then
        status NEEDS_ATTENTION 'active process; application files left intact'
        exit 1
      fi
    done < <(pids)
    # Restore only this release's application paths; do not alter shared configs or data.
    rm -rf "$WEB/api" "$WEB/ROOT" "$WEB/api.war"
    if ! cp -a "$BACKUP/api" "$WEB/api" || ! cp -a "$BACKUP/ROOT" "$WEB/ROOT" || ! cp -a "$BACKUP/api.war" "$WEB/api.war"; then
      status NEEDS_ATTENTION 'backup restoration failed'
      exit 1
    fi
    if restart; then status ROLLED_BACK; else status NEEDS_ATTENTION 'restored application failed health check'; fi
  else
    status FAILED 'preflight or staging failed; live application untouched'
  fi
  exit "$code"
}
trap 'rollback $?' ERR
trap 'rollback 130' INT
trap 'rollback 143' TERM

exec 9>"$BASE/.toto-test-deploy.lock"
if ! flock -n 9; then status FAILED 'another deployment is running'; exit 75; fi
[[ ! -e "$BACKUP" ]]
status STAGING
python3 "$HELPER" stage "$STAGE"
status BACKING_UP
mkdir "$BACKUP"
cp -a "$WEB/api.war" "$BACKUP/api.war"
cp -a "$WEB/api" "$BACKUP/api"
cp -a "$WEB/ROOT" "$BACKUP/ROOT"
cp -a "$CATALINA/conf/gaia-after-sales.properties" "$BACKUP/gaia-after-sales.properties"
python3 "$HELPER" verify-backup "$STAGE"
python3 "$HELPER" unchanged "$STAGE/manifest.json"
PIDS=()
while IFS= read -r pid; do
  if [[ -n "$pid" ]]; then PIDS+=("$pid"); fi
done < <(pids)
[[ ${#PIDS[@]} -eq 1 ]]
status STOPPING
started=1
stop_process "${PIDS[0]}"
rm -rf "$WEB/api" "$WEB/ROOT" "$WEB/api.war"
cp -a "$STAGE/api-ready" "$WEB/api"
cp -a "$STAGE/root-ready" "$WEB/ROOT"
cp -a "$STAGE/api-preserved.war" "$WEB/api.war"
status STARTING
restart
status VERIFYING
python3 "$HELPER" verify-live "$STAGE" >"$STAGE/runtime-verification.json"
python3 "$HELPER" http "$STAGE/manifest.json" http://127.0.0.1:8011 >"$STAGE/http-summary.json"
status COMPLETE
