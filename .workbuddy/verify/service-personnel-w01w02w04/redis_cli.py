#!/usr/bin/env python3
"""Minimal RESP client (no deps) for the local Redis on 16379."""
import socket, sys


class Redis:
    def __init__(self, host="127.0.0.1", port=16379):
        self.sock = socket.create_connection((host, port), timeout=5)
        self.buf = b""

    def _line(self):
        while b"\r\n" not in self.buf:
            self.buf += self.sock.recv(65536)
        line, self.buf = self.buf.split(b"\r\n", 1)
        return line

    def _read(self):
        line = self._line()
        kind, rest = line[:1], line[1:]
        if kind == b"+":
            return rest.decode()
        if kind == b"-":
            return Exception(rest.decode())
        if kind == b":":
            return int(rest)
        if kind == b"$":
            n = int(rest)
            if n == -1:
                return None
            while len(self.buf) < n + 2:
                self.buf += self.sock.recv(65536)
            val, self.buf = self.buf[:n], self.buf[n + 2:]
            return val.decode("utf-8", "replace")
        if kind == b"*":
            n = int(rest)
            return [self._read() for _ in range(n)] if n != -1 else None
        raise ValueError(f"unknown reply {line!r}")

    def cmd(self, *args):
        out = [b"*%d\r\n" % len(args)]
        for a in args:
            b = str(a).encode()
            out.append(b"$%d\r\n%s\r\n" % (len(b), b))
        self.sock.sendall(b"".join(out))
        return self._read()


if __name__ == "__main__":
    r = Redis()
    print("PING:", r.cmd("PING"))
    keys = r.cmd("KEYS", "ID_KE_*")
    for k in sorted(keys or []):
        print(f"{k:50s} = {r.cmd('GET', k)}")
    print(f"[{len(keys or [])} keys]")
