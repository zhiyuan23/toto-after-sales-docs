#!/usr/bin/env python3
"""HTTP harness for the service-personnel mobile API verification."""
import json, os, sys, urllib.error, urllib.request

BASE = "http://127.0.0.1:8080/api/api"
HERE = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(HERE, "session.json")) as fh:
    SESSION = json.load(fh)["sessionId"]


def call(method, path, body=None, token=None, tenant="TOTO", raw=False, timeout=30):
    url = BASE + path
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(url, data=data, method=method)
    req.add_header("x-tenant", tenant)
    req.add_header("Content-Type", "application/json")
    tok = SESSION if token is None else token
    if tok:
        req.add_header("X-AFS-SESSION-ID", tok)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            payload = resp.read().decode()
            status = resp.status
    except urllib.error.HTTPError as err:
        payload = err.read().decode()
        status = err.code
    except Exception as err:  # noqa: BLE001
        return {"_transport": f"{type(err).__name__}: {err}"}
    try:
        parsed = json.loads(payload)
    except json.JSONDecodeError:
        parsed = payload
    return {"_status": status, "_body": parsed} if raw else parsed


def ok(env):
    return isinstance(env, dict) and env.get("code") == 0


def res(env, limit=4000):
    text = json.dumps(env, ensure_ascii=False, indent=2)
    return text if len(text) <= limit else text[:limit] + "\n…(truncated)"


TASKS = "/afterSales/mobile/service-personnel/tasks"
CTX = "/afterSales/mobile/service-personnel/context"
