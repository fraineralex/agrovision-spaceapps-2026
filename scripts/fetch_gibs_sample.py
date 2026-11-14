#!/usr/bin/env python3
"""Cache verified GIBS imagery. AI: Codex/OpenAI, 2026-11-14; Frainer review pending."""
import json
from pathlib import Path
import requests

ROOT = Path(__file__).resolve().parents[1]

def main():
    folder = ROOT / "data/cache/gibs"
    # Preserve exact source URLs and tile coordinates checked against capabilities.
    for tile in json.loads((folder / "manifest.json").read_text()):
        response = requests.get(tile["url"], timeout=30)
        response.raise_for_status()
        if not response.headers.get("Content-Type", "").startswith("image/"):
            raise ValueError("GIBS returned a non-image; cache preserved")
        (folder / tile["file"]).write_bytes(response.content)
        print(f"Cached {tile['id']}")

if __name__ == "__main__":
    main()
