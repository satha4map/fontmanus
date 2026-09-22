#!/usr/bin/env python3
from __future__ import annotations

import sys
from fontTools.ttLib import TTFont

font = TTFont(sys.argv[1])
print(f"has_fvar={'fvar' in font}")
print(f"has_gvar={'gvar' in font}")
print(f"tables={','.join(font.keys())}")
if "fvar" in font:
    raise SystemExit("variable axes remain in output")
