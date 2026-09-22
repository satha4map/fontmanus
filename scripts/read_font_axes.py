#!/usr/bin/env python3
from __future__ import annotations

import json
import sys
from fontTools.ttLib import TTFont


def main() -> None:
    font = TTFont(sys.argv[1], lazy=False)
    axes = []
    if "fvar" in font:
        for axis in font["fvar"].axes:
            axes.append({
                "tag": axis.axisTag,
                "name": axis.axisTag,
                "min": round(float(axis.minValue), 3),
                "default": round(float(axis.defaultValue), 3),
                "max": round(float(axis.maxValue), 3),
            })
    print(json.dumps(axes, ensure_ascii=False))


if __name__ == "__main__":
    main()
