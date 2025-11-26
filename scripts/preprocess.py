"""Simple preprocessing helpers for building fine-tuning datasets.

This script is a starting point. Customize tokenization, deduplication,
and QA pairing logic as needed.
"""

import json
from pathlib import Path


def to_jsonl(input_path: str, output_path: str):
    p = Path(input_path)
    out = Path(output_path)
    docs = []
    if p.suffix.lower() == '.json':
        docs = json.loads(p.read_text())
    else:
        # naive: read as text
        docs = [{'text': p.read_text()}]
    out.write_text('\n'.join(json.dumps(d) for d in docs))


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('input')
    parser.add_argument('output')
    args = parser.parse_args()
    to_jsonl(args.input, args.output)
