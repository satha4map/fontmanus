from fontTools.ttLib import TTFont
import sys

font = TTFont(sys.argv[1])
if "GSUB" not in font:
    print("NO_GSUB")
    raise SystemExit

table = font["GSUB"].table
for i, record in enumerate(table.FeatureList.FeatureRecord):
    feature = record.Feature
    print(f"FEATURE {i} {record.FeatureTag} lookups={feature.LookupCount} indices={feature.LookupListIndex}")
for script_record in table.ScriptList.ScriptRecord:
    script = script_record.Script
    print(f"SCRIPT {script_record.ScriptTag} default={script.DefaultLangSys.ReqFeatureIndex if script.DefaultLangSys else None}")
    if script.DefaultLangSys:
        print("  default features", script.DefaultLangSys.FeatureIndex)
    for lang_record in script.LangSysRecord or []:
        lang = lang_record.LangSys
        print(f"  LANG {lang_record.LangSysTag} required={lang.ReqFeatureIndex} features={lang.FeatureIndex}")
print("lookups", table.LookupList.LookupCount)
print("glyphs", len(font.getGlyphOrder()))
print("tables", font.keys())
