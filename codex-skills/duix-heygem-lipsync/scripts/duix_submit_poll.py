#!/usr/bin/env python3
"""Submit and poll a DUIX/HeyGem gen-video lip-sync job."""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.parse
import urllib.request


def request_json(method: str, url: str, payload: dict | None = None, timeout: int = 30) -> dict:
    data = None
    headers = {"Accept": "application/json"}
    if payload is not None:
        data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        headers["Content-Type"] = "application/json"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            body = resp.read().decode("utf-8", errors="replace")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"HTTP {exc.code} from {url}: {body}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Request failed for {url}: {exc}") from exc

    try:
        return json.loads(body)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"Non-JSON response from {url}: {body[:500]}") from exc


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-url", required=True, help="Base URL, e.g. http://127.0.0.1:8383")
    parser.add_argument("--code", required=True, help="Unique job id")
    parser.add_argument("--video-url", required=True, help="Container-readable source video path")
    parser.add_argument("--audio-url", required=True, help="Container-readable driving audio path")
    parser.add_argument("--watermark-switch", type=int, default=0)
    parser.add_argument("--digital-auth", type=int, default=0)
    parser.add_argument("--chaofen", type=int, default=0)
    parser.add_argument("--pn", type=int, default=1)
    parser.add_argument("--interval", type=float, default=15.0, help="Polling interval in seconds")
    parser.add_argument("--timeout", type=float, default=3600.0, help="Overall timeout in seconds")
    parser.add_argument("--request-timeout", type=int, default=60, help="Per-request timeout in seconds")
    parser.add_argument("--no-submit", action="store_true", help="Only poll an existing job")
    args = parser.parse_args()

    base = args.base_url.rstrip("/")
    payload = {
        "code": args.code,
        "video_url": args.video_url,
        "audio_url": args.audio_url,
        "watermark_switch": args.watermark_switch,
        "digital_auth": args.digital_auth,
        "chaofen": args.chaofen,
        "pn": args.pn,
    }

    if not args.no_submit:
        submit_url = f"{base}/easy/submit"
        print(f"Submitting {args.code} -> {submit_url}", flush=True)
        print(json.dumps(payload, ensure_ascii=False, indent=2), flush=True)
        submit_resp = request_json("POST", submit_url, payload, timeout=args.request_timeout)
        print(json.dumps(submit_resp, ensure_ascii=False, indent=2), flush=True)

    query_url = f"{base}/easy/query?{urllib.parse.urlencode({'code': args.code})}"
    deadline = time.time() + args.timeout
    while time.time() < deadline:
        resp = request_json("GET", query_url, timeout=args.request_timeout)
        data = resp.get("data") or {}
        status = data.get("status")
        progress = data.get("progress", resp.get("progress"))
        print(f"status={status} progress={progress} response={json.dumps(resp, ensure_ascii=False)}", flush=True)
        if status == 2 and progress == 100:
            print(f"Done. Expected result: {args.code}-r.mp4", flush=True)
            return 0
        time.sleep(args.interval)

    print(f"Timed out waiting for job {args.code}", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
