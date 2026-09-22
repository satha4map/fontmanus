#!/usr/bin/env python3
"""Bake selected GSUB/GPOS features into a font's required feature slots.

This keeps the font's original outlines and lookup tables, while making the
selected lookups required for every language system that already advertises
them. Existing required features are preserved in the generated lookup set.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterable

from fontTools.ttLib import TTFont
from fontTools.ttLib.tables import otTables


NO_REQUIRED_FEATURE = 0xFFFF


def lookup_indices_for_feature(feature_records, feature_index: int) -> list[int]:
    if feature_index < 0 or feature_index >= len(feature_records):
        return []
    return list(feature_records[feature_index].Feature.LookupListIndex or [])


def ordered_unique(values: Iterable[int]) -> list[int]:
    result: list[int] = []
    seen: set[int] = set()
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def bake_layout_table(layout_table, selected_tags: set[str]) -> int:
    """Make selected features required in GSUB or GPOS. Return changed systems."""
    if not layout_table or not layout_table.ScriptList or not layout_table.FeatureList:
        return 0

    feature_records = layout_table.FeatureList.FeatureRecord
    feature_indices_by_tag: dict[str, list[int]] = {}
    for index, record in enumerate(feature_records):
        feature_indices_by_tag.setdefault(record.FeatureTag, []).append(index)

    selected_feature_indices = {
        index
        for tag in selected_tags
        for index in feature_indices_by_tag.get(tag, [])
    }
    if not selected_feature_indices:
        return 0

    synthetic_by_lookup_key: dict[tuple[int, ...], int] = {}
    changed_systems = 0

    def make_required_feature(lookup_indices: list[int]) -> int:
        nonlocal feature_records
        key = tuple(lookup_indices)
        existing = synthetic_by_lookup_key.get(key)
        if existing is not None:
            return existing

        feature_record = otTables.FeatureRecord()
        feature_record.FeatureTag = "F001"
        feature_record.Feature = otTables.Feature()
        feature_record.Feature.FeatureParams = None
        feature_record.Feature.LookupListIndex = lookup_indices
        feature_record.Feature.LookupCount = len(lookup_indices)
        feature_records.append(feature_record)
        feature_index = len(feature_records) - 1
        synthetic_by_lookup_key[key] = feature_index
        return feature_index

    def bake_langsys(lang_sys) -> bool:
        if lang_sys is None:
            return False

        active_indices = list(lang_sys.FeatureIndex or [])
        selected_in_system = [index for index in active_indices if index in selected_feature_indices]
        old_required = lang_sys.ReqFeatureIndex
        if not selected_in_system and old_required == NO_REQUIRED_FEATURE:
            return False

        lookups: list[int] = []
        if old_required != NO_REQUIRED_FEATURE:
            lookups.extend(lookup_indices_for_feature(feature_records, old_required))
        for feature_index in selected_in_system:
            lookups.extend(lookup_indices_for_feature(feature_records, feature_index))
        lookups = ordered_unique(lookups)
        if not lookups:
            return False

        lang_sys.FeatureIndex = [index for index in active_indices if index not in selected_feature_indices]
        lang_sys.ReqFeatureIndex = make_required_feature(lookups)
        return True

    for script_record in layout_table.ScriptList.ScriptRecord:
        script = script_record.Script
        if bake_langsys(script.DefaultLangSys):
            changed_systems += 1
        for lang_record in script.LangSysRecord or []:
            if bake_langsys(lang_record.LangSys):
                changed_systems += 1

    layout_table.FeatureList.FeatureCount = len(feature_records)
    return changed_systems


def main() -> int:
    if len(sys.argv) != 4:
        print("usage: embed_font_features.py INPUT OUTPUT FEATURES", file=sys.stderr)
        return 2

    input_path = Path(sys.argv[1])
    output_path = Path(sys.argv[2])
    selected_tags = {tag.strip().lower() for tag in sys.argv[3].split(",") if tag.strip()}
    if not selected_tags:
        raise ValueError("At least one OpenType feature is required")

    font = TTFont(str(input_path), recalcBBoxes=False, recalcTimestamp=False)
    changed_tables = 0
    changed_systems = 0
    for table_tag in ("GSUB", "GPOS"):
        if table_tag in font:
            changed = bake_layout_table(font[table_tag].table, selected_tags)
            if changed:
                changed_tables += 1
                changed_systems += changed

    if changed_tables == 0:
        raise ValueError("The uploaded font has no matching GSUB/GPOS feature records for the selected tags")

    output_path.parent.mkdir(parents=True, exist_ok=True)
    # Always return an installable TTF/OTF container, even when the source was WOFF/WOFF2.
    font.flavor = None
    font.save(str(output_path), reorderTables=False)
    print(f"embedded {len(selected_tags)} feature tags across {changed_tables} tables and {changed_systems} language systems")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"font processing failed: {exc}", file=sys.stderr)
        raise
