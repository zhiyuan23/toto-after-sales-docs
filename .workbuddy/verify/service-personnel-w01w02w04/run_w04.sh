#!/bin/zsh
# W04 端到端验证固定流程：重建夹具 -> 校准主键序列 -> 运行验证
# 夹具必须先跑，否则上轮残留的库存单据会因唯一键冲突造成假失败。
set -e
PY=/Users/snow/.workbuddy/binaries/python/envs/default/bin/python
cd /tmp/afs
echo "===== 1/3 重建 W2 夹具 ====="
$PY -u fixture_w2.py
echo "===== 2/3 校准 Redis 主键序列 ====="
$PY -u calibrate_seq.py
echo "===== 3/3 运行 W04 验证 ====="
$PY -u t_w04.py
