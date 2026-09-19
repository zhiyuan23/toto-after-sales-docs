#!/usr/bin/env python3
"""Create a known-token mobile session for the local verification run.

Authorized by the user for the test database gaia_wh_init_wzy only.
Side effect: one INSERT into afs_service_personnel_session (removed by cleanup.py).
"""
import base64, hashlib, json, os, secrets, sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from db import conn

ACCOUNT_ID = 2            # sunzhiyuan
ENTERPRISE_ID = "161"
STATION_ID = "5"
SESSION_ID = 8            # next free id, keeps generator floor low

raw = base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip("=")
token_hash = hashlib.sha256(raw.encode()).hexdigest()
expires_at = datetime.now() + timedelta(hours=8)

c = conn()
with c.cursor() as cur:
    cur.execute("DELETE FROM afs_service_personnel_session WHERE id=%s", (SESSION_ID,))
    cur.execute(
        """INSERT INTO afs_service_personnel_session
           (id,account_id,token_hash,selected_enterprise_id,selected_station_id,
            context_revision,expires_at,revoked_at,create_time,last_seen_at)
           VALUES (%s,%s,%s,%s,%s,%s,%s,NULL,%s,%s)""",
        (SESSION_ID, ACCOUNT_ID, token_hash, ENTERPRISE_ID, STATION_ID, 2,
         expires_at, datetime.now(), datetime.now()))
c.commit()
c.close()

path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "session.json")
with open(path, "w") as fh:
    json.dump({"sessionId": raw, "sessionRowId": SESSION_ID,
               "accountId": str(ACCOUNT_ID), "expiresAt": expires_at.isoformat()}, fh)
os.chmod(path, 0o600)
print(f"session row {SESSION_ID} created for account {ACCOUNT_ID}, expires {expires_at:%Y-%m-%d %H:%M}")
