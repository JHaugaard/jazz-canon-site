#!/usr/bin/env python3
"""
Generate the Apple MusicKit *developer token* for the browser (Step 3 full
playback). This is the LONG-LIVED token baked into the build — NOT the ephemeral
one apple_previews.py mints for itself.

Apple caps developer-token lifetime at ~6 months, so this MUST be regenerated
roughly twice a year or full playback stops working. See the printed steps and
docs/apple-token-rotation.md.

The token is PUBLIC by design (it identifies the app, not a user) — safe to ship
to the browser. Your .p8 private key stays local and never leaves this machine.

Usage (from repo root, in the venv):
  .venv/bin/python3 scripts/gen_dev_token.py            # print token + steps
  .venv/bin/python3 scripts/gen_dev_token.py --write    # also update .env.local
"""

import os
import sys
import argparse
from pathlib import Path
from datetime import datetime, timezone, timedelta

import jwt  # PyJWT[crypto]

# 180 days, comfortably under Apple's ~182.6-day (15,777,000s) hard cap.
TOKEN_TTL_DAYS = 180
ENV_VAR = "PUBLIC_APPLE_DEV_TOKEN"
ENV_FILE = ".env.local"


def load_env(path=ENV_FILE):
    if not Path(path).exists():
        return
    for line in Path(path).read_text().splitlines():
        line = line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, _, val = line.partition("=")
            os.environ.setdefault(key.strip(), val.strip())


def make_token(now):
    team_id = os.environ.get("APPLE_MUSIC_TEAM_ID")
    key_id = os.environ.get("APPLE_MUSIC_KEY_ID")
    p8_path = os.environ.get("APPLE_MUSIC_PRIVATE_KEY_PATH")
    missing = [n for n, v in [
        ("APPLE_MUSIC_TEAM_ID", team_id),
        ("APPLE_MUSIC_KEY_ID", key_id),
        ("APPLE_MUSIC_PRIVATE_KEY_PATH", p8_path),
    ] if not v]
    if missing:
        raise SystemExit(f"Missing in {ENV_FILE}: {', '.join(missing)}")
    if not Path(p8_path).exists():
        raise SystemExit(f"Private key not found at {p8_path}")

    exp = now + TOKEN_TTL_DAYS * 24 * 3600
    token = jwt.encode(
        {"iss": team_id, "iat": now, "exp": exp},
        Path(p8_path).read_text(),
        algorithm="ES256",
        headers={"alg": "ES256", "kid": key_id},
    )
    return token, exp


def upsert_env(token):
    """Write/replace PUBLIC_APPLE_DEV_TOKEN in .env.local (for local dev)."""
    p = Path(ENV_FILE)
    lines = p.read_text().splitlines() if p.exists() else []
    line = f"{ENV_VAR}={token}"
    for i, ln in enumerate(lines):
        if ln.strip().startswith(f"{ENV_VAR}="):
            lines[i] = line
            break
    else:
        lines.append("")
        lines.append("# Apple MusicKit developer token (PUBLIC, ~6mo). Regenerate")
        lines.append("# with scripts/gen_dev_token.py. See docs/apple-token-rotation.md.")
        lines.append(line)
    p.write_text("\n".join(lines) + "\n")


def main():
    ap = argparse.ArgumentParser(description="Generate the MusicKit browser developer token.")
    ap.add_argument("--write", action="store_true",
                    help=f"also upsert {ENV_VAR} into {ENV_FILE} for local dev")
    args = ap.parse_args()

    load_env()
    now = int(datetime.now(timezone.utc).timestamp())
    token, exp = make_token(now)
    exp_date = datetime.fromtimestamp(exp, tz=timezone.utc).strftime("%Y-%m-%d")

    bar = "=" * 64
    print(bar)
    print(f"MusicKit developer token  —  EXPIRES {exp_date} (UTC)")
    print(bar)
    print(token)
    print(bar)
    if args.write:
        upsert_env(token)
        print(f"✓ Wrote {ENV_VAR} to {ENV_FILE} (local dev ready).")
    else:
        print(f"(run with --write to drop it into {ENV_FILE} automatically)")
    print()
    print("NEXT STEPS — do BOTH:")
    print(f"  1. Local dev : ensure {ENV_VAR} is in {ENV_FILE} (use --write).")
    print(f"  2. Production: set {ENV_VAR} to this value in your host's")
    print("                build environment variables, then redeploy.")
    print()
    print(f"⏰ ROTATE BEFORE {exp_date}. Full playback stops when it expires.")
    print("   Full instructions: docs/apple-token-rotation.md")
    return 0


if __name__ == "__main__":
    sys.exit(main())
