#!/usr/bin/env python3
"""Align the local test Redis ID sequences with the actual max primary keys.

GaiaIdGenerator (gaia-after-sales) fails closed with "售后业务主键序列未同步" when the
Redis counter `ID_KE_<table>` is below MAX(id) of that table. The hand-seeded shared
test fixtures used explicit ids above the counter, so mobile writes to those tables
returned 503 until the counter was aligned.

Local test Redis only (127.0.0.1:16379); no business data is written.
Usage: calibrate_seq.py [table ...]   (default: scan every ID_KE_afs_* key)
"""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import query
from redis_cli import Redis

r = Redis()
tables = sys.argv[1:]
if not tables:
    tables = sorted(k[len("ID_KE_"):] for k in (r.cmd("KEYS", "ID_KE_afs_*") or []))

aligned = 0
for t in tables:
    key = "ID_KE_" + t
    try:
        mx = query("SELECT MAX(id) FROM " + t)[1][0][0] or 0
    except Exception as err:  # table missing / no id column
        print(f"{t:44s} SKIP    {err}")
        continue
    cur = int(r.cmd("GET", key) or 0)
    if cur >= mx:
        continue
    r.cmd("SET", key, mx)
    aligned += 1
    print(f"{t:44s} ALIGNED counter {cur} -> {mx} (max(id)={mx})")
print(f"已校准 {aligned} 张表；其余 {len(tables) - aligned} 张序列已满足 max(id)")
