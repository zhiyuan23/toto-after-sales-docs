#!/usr/bin/env python3
"""AFS 测试库连接助手。

凭据一律从环境变量读取，不写入仓库。运行前先导出：

    export AFS_DB_HOST=10.1.1.106
    export AFS_DB_PORT=3306
    export AFS_DB_USER=root
    export AFS_DB_PASSWORD=<口令>
    export AFS_DB_NAME=gaia_wh_init_wzy
"""
import os, sys

import pymysql

REQUIRED = ("AFS_DB_HOST", "AFS_DB_USER", "AFS_DB_PASSWORD", "AFS_DB_NAME")


def _conf():
    missing = [k for k in REQUIRED if not os.environ.get(k)]
    if missing:
        sys.exit("缺少数据库环境变量：" + "、".join(missing) + "（见本文件顶部说明）")
    return dict(
        host=os.environ["AFS_DB_HOST"],
        port=int(os.environ.get("AFS_DB_PORT", "3306")),
        user=os.environ["AFS_DB_USER"],
        password=os.environ["AFS_DB_PASSWORD"],
        database=os.environ["AFS_DB_NAME"],
        charset="utf8mb4",
        connect_timeout=8,
        ssl={"ssl": {}},
    )


def conn():
    return pymysql.connect(**_conf())


def query(sql, args=None):
    c = conn()
    try:
        with c.cursor() as cur:
            cur.execute(sql) if args is None else cur.execute(sql, args)
            cols = [d[0] for d in cur.description] if cur.description else []
            rows = cur.fetchall()
        return cols, rows
    finally:
        c.close()


def show(sql, args=None, limit=60):
    cols, rows = query(sql, args)
    print(" | ".join(cols))
    print("-" * 60)
    for r in rows[:limit]:
        print(" | ".join("" if v is None else str(v) for v in r))
    print(f"[{len(rows)} rows]")


if __name__ == "__main__":
    show(sys.argv[1])
