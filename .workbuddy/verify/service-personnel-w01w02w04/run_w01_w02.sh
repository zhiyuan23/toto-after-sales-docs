#!/bin/zsh
# W01/W02 验证固定流程：重建夹具 -> 校准序列 -> 只读校验 -> 写动作校验
set -e
PY=/Users/snow/.workbuddy/binaries/python/envs/default/bin/python
cd /tmp/afs
echo "===== 1/4 重建 W2 夹具 ====="
$PY -u fixture_w2.py
echo "===== 2/4 校准 Redis 主键序列 ====="
$PY -u calibrate_seq.py
echo "===== 3/4 运行 W01 只读验证 ====="
$PY -u t_w01.py
echo "===== 4/4 运行 W02 写动作验证 ====="
$PY -u t_w02.py
