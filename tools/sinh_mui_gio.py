"""Sinh web/src/data/mui_gio_vn.json: các mốc đổi giờ pháp định của Asia/Ho_Chi_Minh (tzdata) để engine TS không phụ thuộc Intl/trình duyệt.

Chạy: python3 tools/sinh_mui_gio.py
"""
import json
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

z = ZoneInfo("Asia/Ho_Chi_Minh")


def off(ts):
    return int(datetime.fromtimestamp(ts, z).utcoffset().total_seconds())


t0 = int(datetime(1890, 1, 1, tzinfo=timezone.utc).timestamp())
t1 = int(datetime(2110, 1, 1, tzinfo=timezone.utc).timestamp())
cur, ts, doi = off(t0), t0, []
ban_dau = cur
while ts < t1:
    nxt = ts + 86400
    if off(nxt) != cur:
        lo, hi = ts, nxt
        while hi - lo > 1:
            mid = (lo + hi) // 2
            lo, hi = (mid, hi) if off(mid) == cur else (lo, mid)
        doi.append([hi, off(hi)])
        cur = off(hi)
    ts = nxt
duong_dan = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "web", "src", "data", "mui_gio_vn.json")
json.dump({"_meta": "Giờ pháp định Asia/Ho_Chi_Minh (tzdata) 1890–2110: [UTC epoch giây, offset giây]. Sinh bởi tools/sinh_mui_gio.py",
           "ban_dau": ban_dau, "doi": doi}, open(duong_dan, "w"), ensure_ascii=False)
print(ban_dau, doi)
