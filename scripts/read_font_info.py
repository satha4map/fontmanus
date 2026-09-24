#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import sys
from typing import Any

from fontTools.ttLib import TTFont


def name_value(font: TTFont, ids: list[int]) -> str:
    if "name" not in font:
        return ""
    records = []
    for name_id in ids:
        records.extend(record for record in font["name"].names if record.nameID == name_id)
    records.sort(key=lambda record: (record.platformID not in (3, 0), record.langID != 0x409))
    for record in records:
        try:
            value = record.toUnicode().strip()
        except Exception:
            value = ""
        if value:
            return value
    return ""


def main() -> None:
    path = sys.argv[1]
    font = TTFont(path, lazy=False)
    names = {
        "family": name_value(font, [16, 1]),
        "subfamily": name_value(font, [17, 2]),
        "fullName": name_value(font, [4]),
        "postscriptName": name_value(font, [6]),
        "version": name_value(font, [5]),
        "designer": name_value(font, [9]),
        "manufacturer": name_value(font, [8]),
        "description": name_value(font, [10]),
        "copyright": name_value(font, [0]),
        "trademark": name_value(font, [7]),
        "license": name_value(font, [13]),
        "licenseUrl": name_value(font, [14]),
        "vendorUrl": name_value(font, [11]),
    }

    axes: list[dict[str, Any]] = []
    if "fvar" in font:
        for axis in font["fvar"].axes:
            axes.append({
                "tag": axis.axisTag,
                "name": axis.axisTag,
                "min": round(float(axis.minValue), 3),
                "default": round(float(axis.defaultValue), 3),
                "max": round(float(axis.maxValue), 3),
            })

    os2 = font["OS/2"] if "OS/2" in font else None
    unicode_ranges = []
    if os2:
        for index in range(1, 5):
            value = getattr(os2, f"ulUnicodeRange{index}", 0)
            if value:
                unicode_ranges.append(f"Unicode Range {index}: 0x{value:08X}")

    flavor = getattr(font, "flavor", None)
    if flavor == "woff2":
        file_format = "WOFF2"
    elif flavor == "woff":
        file_format = "WOFF"
    elif "CFF2" in font:
        file_format = "OTF (CFF2)"
    elif "CFF " in font:
        file_format = "OTF (CFF)"
    else:
        file_format = "TTF (TrueType outlines)"

    output = {
        **names,
        "fileFormat": file_format,
        "fileSize": os.path.getsize(path),
        "tables": sorted(font.keys()),
        "tableCount": len(font.keys()),
        "glyphCount": int(font["maxp"].numGlyphs) if "maxp" in font else None,
        "unitsPerEm": int(font["head"].unitsPerEm) if "head" in font else None,
        "axes": axes,
        "unicodeRanges": unicode_ranges,
        "hasColor": any(table in font for table in ("COLR", "CPAL", "CBDT", "CBLC", "SVG ")),
    }
    print(json.dumps(output, ensure_ascii=False))


if __name__ == "__main__":
    main()
