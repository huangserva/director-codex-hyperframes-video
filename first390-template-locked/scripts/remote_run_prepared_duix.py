#!/usr/bin/env python3
"""Run prepared DUIX gen-video jobs on the remote DUIX host.

This script is copied to the DUIX server by submit-prepared-duix-jobs.mjs.
It never stores passwords. It assumes sudo is already available non-interactively.
"""

from __future__ import annotations

import argparse
import json
import shutil
import subprocess
import sys
import time
import urllib.request
from pathlib import Path


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+ " + " ".join(cmd), flush=True)
    return subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT, check=check)


def sudo(*args: str) -> subprocess.CompletedProcess[str]:
    return run(["sudo", "-n", *args])


def docker_python(container: str, code: str, env: dict[str, str]) -> str:
    cmd = ["sudo", "-n", "docker", "exec", "-i"]
    for key, value in env.items():
        cmd.extend(["-e", f"{key}={value}"])
    cmd.extend([container, "python", "-"])
    proc = subprocess.run(cmd, input=code, text=True, stdout=subprocess.PIPE, stderr=subprocess.STDOUT)
    print(proc.stdout, end="", flush=True)
    if proc.returncode != 0:
        raise RuntimeError(f"docker python failed with {proc.returncode}")
    return proc.stdout


SUBMIT_CODE = r"""
import json, os, urllib.request
job = os.environ["JOB_ID"]
payload = {
  "code": job,
  "video_url": f"/code/data/jobs/{job}/source.mp4",
  "audio_url": f"/code/data/jobs/{job}/dub.wav",
  "watermark_switch": 0,
  "digital_auth": 0,
  "chaofen": 0,
  "pn": 1,
}
req = urllib.request.Request(
  "http://duix-avatar-gen-video:8383/easy/submit",
  data=json.dumps(payload).encode("utf-8"),
  headers={"Content-Type": "application/json"},
)
print(json.dumps({"payload": payload}, ensure_ascii=False), flush=True)
print(urllib.request.urlopen(req, timeout=120).read().decode("utf-8", errors="replace"), flush=True)
"""


QUERY_CODE = r"""
import os, urllib.request
job = os.environ["JOB_ID"]
url = f"http://duix-avatar-gen-video:8383/easy/query?code={job}"
print(urllib.request.urlopen(url, timeout=90).read().decode("utf-8", errors="replace"), flush=True)
"""


def is_done(text: str) -> bool:
    try:
        data = json.loads(text.splitlines()[-1])
    except Exception:
        return '"status":2' in text.replace(" ", "") or '"progress":100' in text.replace(" ", "")
    payload = data.get("data") or data
    status = payload.get("status")
    progress = payload.get("progress", payload.get("process"))
    return status == 2 and int(progress or 0) >= 100


def parse_last_json(text: str) -> dict:
    for line in reversed(text.splitlines()):
        line = line.strip()
        if not line.startswith("{"):
            continue
        try:
            return json.loads(line)
        except Exception:
            continue
    return {}


def submit_job(job_id: str, *, retries: int = 20, interval: float = 30.0) -> str:
    last_text = ""
    for attempt in range(1, retries + 1):
        last_text = docker_python("duix-api", SUBMIT_CODE, {"JOB_ID": job_id})
        compact = "".join(last_text.split())
        accepted = '"code":10000' in compact or '"code":0' in compact
        busy = '"code":10001' in compact or "忙碌" in last_text
        if accepted:
            return last_text
        if busy:
            print(f"[submit-busy] {job_id} attempt={attempt}/{retries}; retry in {interval:.0f}s", flush=True)
            time.sleep(interval)
            continue
        raise RuntimeError(f"submit rejected for {job_id}: {last_text}")
    raise RuntimeError(f"submit stayed busy for {job_id}: {last_text}")


def is_failed(text: str) -> bool:
    lowered = text.lower()
    compact = lowered.replace(" ", "")
    return (
        "error" in lowered
        or "failed" in lowered
        or '"status":-1' in compact
        or "任务不存在" in text
    )


def find_result(face_host: Path, job_id: str) -> Path | None:
    expected = face_host / "temp" / f"{job_id}-r.mp4"
    test = run(["sudo", "-n", "test", "-f", str(expected)], check=False)
    if test.returncode == 0:
        return expected
    proc = sudo("find", str(face_host), "-maxdepth", "5", "-type", "f", "-name", f"{job_id}-r.mp4")
    for line in proc.stdout.splitlines():
        candidate = Path(line.strip())
        if candidate.name == f"{job_id}-r.mp4":
            return candidate
    return None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--jobs", required=True)
    parser.add_argument("--upload-root", required=True)
    parser.add_argument("--run-root", required=True)
    parser.add_argument("--face-host", default="/root/duix_avatar_data/face2face")
    parser.add_argument("--poll-interval", type=float, default=30.0)
    parser.add_argument("--timeout", type=float, default=7200.0)
    parser.add_argument("--resume", action="store_true")
    args = parser.parse_args()

    jobs = json.loads(Path(args.jobs).read_text(encoding="utf-8"))
    upload_root = Path(args.upload_root)
    run_root = Path(args.run_root)
    face_host = Path(args.face_host)
    results_dir = run_root / "results"
    logs_dir = run_root / "logs"
    results_dir.mkdir(parents=True, exist_ok=True)
    logs_dir.mkdir(parents=True, exist_ok=True)

    sudo("true")
    summary: dict[str, dict[str, str]] = {}

    for job in jobs:
        asset_slot = job["asset_slot"]
        job_id = job["job_id"]
        result_out = results_dir / f"{job_id}-r.mp4"
        log_path = logs_dir / f"{job_id}.log"

        if args.resume and result_out.exists() and result_out.stat().st_size > 0:
            print(f"[skip] {asset_slot} already has {result_out}", flush=True)
            summary[asset_slot] = {"job_id": job_id, "status": "complete", "result": str(result_out)}
            continue

        existing = find_result(face_host, job_id) if args.resume else None
        if existing is not None:
            print(f"[collect-existing] {asset_slot}: {existing}", flush=True)
            sudo("cp", str(existing), str(result_out))
            sudo("chown", "linux:linux", str(result_out))
            summary[asset_slot] = {"job_id": job_id, "status": "complete", "result": str(result_out)}
            continue

        source = upload_root / job["source_plate"]
        dub = upload_root / job["dub_wav"]
        if not source.is_file() or not dub.is_file():
            raise FileNotFoundError(f"missing prepared files for {asset_slot}: {source}, {dub}")

        job_host = face_host / "jobs" / job_id
        print(f"[prepare] {asset_slot} -> {job_id}", flush=True)
        sudo("mkdir", "-p", str(job_host))
        sudo("cp", str(source), str(job_host / "source.mp4"))
        sudo("cp", str(dub), str(job_host / "dub.wav"))
        sudo("ls", "-la", str(job_host))

        print(f"[submit] {asset_slot} {job_id}", flush=True)
        submit_text = submit_job(job_id)
        log_path.write_text(f"SUBMIT\n{submit_text}\n", encoding="utf-8")

        deadline = time.monotonic() + args.timeout
        last_query = ""
        while True:
            if time.monotonic() > deadline:
                raise TimeoutError(f"{asset_slot} timed out: {job_id}")
            time.sleep(args.poll_interval)
            print(f"[poll] {asset_slot} {job_id}", flush=True)
            try:
                last_query = docker_python("duix-api", QUERY_CODE, {"JOB_ID": job_id})
            except Exception as exc:
                last_query = f"QUERY_ERROR {exc!r}"
                print(last_query, flush=True)
            with log_path.open("a", encoding="utf-8") as f:
                f.write(f"\nPOLL {time.strftime('%Y-%m-%dT%H:%M:%S')}\n{last_query}\n")
            if is_done(last_query):
                break
            if is_failed(last_query):
                raise RuntimeError(f"{asset_slot} failed: {last_query}")

        found = find_result(face_host, job_id)
        if found is None:
            raise FileNotFoundError(f"{job_id}-r.mp4 not found under {face_host}")
        sudo("cp", str(found), str(result_out))
        sudo("chown", "linux:linux", str(result_out))
        if not result_out.is_file() or result_out.stat().st_size == 0:
            raise RuntimeError(f"empty result: {result_out}")
        print(f"[done] {asset_slot}: {result_out} {result_out.stat().st_size} bytes", flush=True)
        summary[asset_slot] = {"job_id": job_id, "status": "complete", "result": str(result_out)}

    summary_path = run_root / "duix-run-summary.json"
    summary_path.write_text(json.dumps(summary, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"[all-done] {summary_path}", flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
