import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useTheme, type ColorTheme } from "@/contexts/ThemeContext";
import {
  ArrowUpLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  Download,
  Eye,
  Grid2X2,
  Info,
  LayoutDashboard,
  LoaderCircle,
  Menu,
  Moon,
  Palette,
  Plus,
  RotateCcw,
  Settings2,
  Send,
  Sparkles,
  Sun,
  Type,
  WandSparkles,
  X,
} from "lucide-react";

type FeatureGroup = "أساسي" | "سياقي" | "أرقام" | "أسلوبي";

type Feature = {
  code: string;
  label: string;
  english: string;
  description: string;
  group: FeatureGroup;
  recommended?: boolean;
};

type VariableAxis = { tag: string; name: string; min: number; default: number; max: number };

const features: Feature[] = [
  {
    code: "liga",
    label: "الربطات القياسية",
    english: "Standard ligatures",
    description: "تصل الحروف والتراكيب الشائعة بسلاسة حسب تصميم الخط.",
    group: "أساسي",
    recommended: true,
  },
  {
    code: "rlig",
    label: "الربطات الضرورية",
    english: "Required ligatures",
    description: "تضمن الأشكال الضرورية لسلامة النص العربي في الخطوط الداعمة.",
    group: "أساسي",
    recommended: true,
  },
  {
    code: "calt",
    label: "بدائل سياقية",
    english: "Contextual alternates",
    description: "تختار أشكالاً بديلة اعتماداً على الحروف المجاورة والسياق.",
    group: "سياقي",
    recommended: true,
  },
  {
    code: "locl",
    label: "أشكال محلية",
    english: "Localized forms",
    description: "تفعّل معالجات محلية خاصة باللغة والنظام الكتابي.",
    group: "سياقي",
  },
  {
    code: "frac",
    label: "كسور حقيقية",
    english: "Fractions",
    description: "تحوّل صيغ الكسور إلى أرقام مصغّرة عند دعم الخط.",
    group: "أرقام",
  },
  {
    code: "tnum",
    label: "أرقام جدوليّة",
    english: "Tabular figures",
    description: "تجعل عرض الأرقام ثابتاً لتبدو الأعمدة المالية أكثر انتظاماً.",
    group: "أرقام",
  },
  {
    code: "ss01",
    label: "مجموعة أسلوبية 01",
    english: "Stylistic set 01",
    description: "تعرض البديل الأسلوبي الأول المتاح في تصميم الخط.",
    group: "أسلوبي",
  },
  {
    code: "salt",
    label: "بدائل أسلوبية",
    english: "Stylistic alternates",
    description: "تسمح للخط باختيار بدائل زخرفية أو ذات طابع خاص.",
    group: "أسلوبي",
  },
];

const fontOptions = [
  { name: "Amiri", className: "font-amiri", family: '"Amiri", serif' },
  { name: "Noto Naskh Arabic", className: "font-naskh", family: '"Noto Naskh Arabic", serif' },
  { name: "IBM Plex Sans Arabic", className: "font-plex", family: '"IBM Plex Sans Arabic", sans-serif' },
];

const samplePresets = [
  "تتبدّل الحروف حين تجد مساحةً للحكاية.",
  "أبجد هوز حطي كلمن سعفص قرشت ثخذ ضظغ",
  "الخط الجيد يجعل القراءة فكرةً لا عائقاً.",
];

const stylisticSets = [
  ...Array.from({ length: 20 }, (_, index) => {
    const number = String(index + 1).padStart(2, "0");
    return { code: `ss${number}`, label: `أسلوب ${number}` };
  }),
  { code: "salt", label: "بدائل" },
  { code: "swsh", label: "امتدادات" },
  { code: "cswh", label: "وصلات" },
];

const colorThemes: Array<{ id: ColorTheme; label: string; swatch: string }> = [
  { id: "sand", label: "رملي", swatch: "#b46c3f" },
  { id: "ocean", label: "محيطي", swatch: "#32859a" },
  { id: "forest", label: "غابي", swatch: "#4d8b72" },
  { id: "plum", label: "برقوقي", swatch: "#9a648b" },
  { id: "sunset", label: "غروب", swatch: "#d47b58" },
];

export default function Home() {
  const { theme, toggleTheme, colorTheme, setColorTheme } = useTheme();
  const [activeFeatures, setActiveFeatures] = useState<string[]>(["liga", "rlig", "calt"]);
  const [selectedFeature, setSelectedFeature] = useState("liga");
  const [fontIndex, setFontIndex] = useState(0);
  const [uploadedFont, setUploadedFont] = useState<{ name: string; url: string; family: string } | null>(null);
  const [sourceFontFile, setSourceFontFile] = useState<File | null>(null);
  const [variableAxes, setVariableAxes] = useState<VariableAxis[]>([]);
  const [axisValues, setAxisValues] = useState<Record<string, number>>({});
  const [axisLoading, setAxisLoading] = useState(false);
  const [isBakingFont, setIsBakingFont] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportPhase, setExportPhase] = useState<"idle" | "preparing" | "processing" | "downloading" | "complete">("idle");
  const [exportError, setExportError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.45);
  const [text, setText] = useState(samplePresets[0]);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const fontInputRef = useRef<HTMLInputElement>(null);

  const selected = features.find((feature) => feature.code === selectedFeature) ?? features[0];
  const selectedStyle = stylisticSets.find((style) => style.code === selectedFeature);
  const selectedTitle = selectedStyle?.label ?? selected.label;
  const selectedDescription = selectedStyle ? "تبدّل هذه المجموعة أشكالاً محددة من الحروف إذا كان الخط يدعمها." : selected.description;
  const selectedEnglish = selectedStyle ? `Stylistic set ${selectedStyle.code.toUpperCase()}` : selected.english;
  const availableFonts = uploadedFont ? [...fontOptions, { ...uploadedFont, className: "font-uploaded" }] : fontOptions;
  const chosenFont = availableFonts[fontIndex] ?? availableFonts[0];

  useEffect(() => {
    if (!uploadedFont) return;
    const style = document.createElement("style");
    style.dataset.uploadedFont = "true";
    style.textContent = `@font-face { font-family: "${uploadedFont.family}"; src: url("${uploadedFont.url}"); font-display: swap; }`;
    document.head.appendChild(style);
    return () => style.remove();
  }, [uploadedFont]);

  const featureSettings = useMemo(
    () => activeFeatures.map((code) => `"${code}" 1`).join(", ") || "normal",
    [activeFeatures],
  );

  const variationSettings = useMemo(
    () => variableAxes.map((axis) => `"${axis.tag}" ${axisValues[axis.tag] ?? axis.default}`).join(", "),
    [variableAxes, axisValues],
  );

  const cssSnippet = useMemo(
    () => `.your-text {\n  font-family: ${chosenFont.family};\n  font-size: ${fontSize}px;\n  line-height: ${lineHeight};\n  font-feature-settings: ${featureSettings};${variationSettings ? `\n  font-variation-settings: ${variationSettings};` : ""}\n}`,
    [chosenFont, featureSettings, variationSettings, fontSize, lineHeight],
  );

  function toggleFeature(code: string) {
    setSelectedFeature(code);
    setActiveFeatures((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  function toggleStyle(code: string) {
    setSelectedFeature(code);
    setActiveFeatures((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
  }

  async function handleFontUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const family = `UploadedFont_${file.name.replace(/[^a-zA-Z0-9]/g, "_")}`;
    const url = URL.createObjectURL(file);
    setUploadedFont({ name: file.name.replace(/\.(woff2?|ttf|otf)$/i, ""), url, family });
    setSourceFontFile(file);
    setVariableAxes([]);
    setAxisValues({});
    setAxisLoading(true);
    setFontIndex(fontOptions.length);
    try {
      const response = await fetch("/api/fonts/axes", {
        method: "POST",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (response.ok) {
        const payload = await response.json() as { axes?: VariableAxis[] };
        const axes = payload.axes ?? [];
        setVariableAxes(axes);
        setAxisValues(Object.fromEntries(axes.map((axis) => [axis.tag, axis.default])));
      }
    } catch {
      setVariableAxes([]);
    } finally {
      setAxisLoading(false);
    }
  }

  function downloadBlob(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function downloadConfiguredFont() {
    if (!sourceFontFile || !uploadedFont || isBakingFont) return;
    setIsBakingFont(true);
    setExportError(null);
    setExportProgress(8);
    setExportPhase("preparing");
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 180));
      setExportPhase("processing");
      setExportProgress(28);
      const response = await fetch("/api/fonts/bake", {
        method: "POST",
        headers: {
          "Content-Type": sourceFontFile.type || "application/octet-stream",
          "X-OpenType-Features": activeFeatures.join(","),
          "X-OpenType-Axes": JSON.stringify(axisValues),
        },
        body: sourceFontFile,
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(payload?.error || "تعذّر دمج خصائص الخط");
      }
      setExportPhase("downloading");
      const contentLength = Number(response.headers.get("content-length") || 0);
      if (!response.body) {
        setExportProgress(92);
        const blob = await response.blob();
        const baseName = uploadedFont.name.replace(/\.[^.]+$/, "");
        const outputExtension = /\.otf$/i.test(sourceFontFile.name) ? ".otf" : ".ttf";
        downloadBlob(blob, `${baseName}-مضمّن-الخصائص${outputExtension}`);
        setExportProgress(100);
        setExportPhase("complete");
        return;
      }
      const reader = response.body.getReader();
      const chunks: Uint8Array[] = [];
      let received = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.byteLength;
          const downloadProgress = contentLength ? Math.round((received / contentLength) * 25) : 12;
          setExportProgress(Math.min(97, 72 + downloadProgress));
        }
      }
      const data = new Uint8Array(received);
      let offset = 0;
      for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
      const blob = new Blob([data], { type: response.headers.get("content-type") || "font/ttf" });
      const baseName = uploadedFont.name.replace(/\.[^.]+$/, "");
      const outputExtension = /\.otf$/i.test(sourceFontFile.name) ? ".otf" : ".ttf";
      downloadBlob(blob, `${baseName}-مضمّن-الخصائص${outputExtension}`);
      setExportProgress(100);
      setExportPhase("complete");
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "تعذّر تنزيل الخط المدمج");
      setExportPhase("idle");
      setExportProgress(0);
    } finally {
      window.setTimeout(() => setIsBakingFont(false), 450);
    }
  }

  async function copyCSS() {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  function resetWorkspace() {
    setActiveFeatures(["liga", "rlig", "calt"]);
    setFontIndex(0);
    setAxisValues(Object.fromEntries(variableAxes.map((axis) => [axis.tag, axis.default])));
    setFontSize(64);
    setLineHeight(1.45);
    setText(samplePresets[0]);
    setSelectedFeature("liga");
  }

  return (
    <div className="app-shell" dir="rtl">
      <aside className={`sidebar ${menuOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <div className="brand-mark" aria-hidden="true">م</div>
          <div className="brand-copy">
            <div className="brand-name">مختبر أحمد النهر</div>
            <div className="brand-meta">مختبر OpenType</div>
          </div>
          <button className="mobile-close" onClick={() => setMenuOpen(false)} aria-label="إغلاق القائمة">
            <X size={20} />
          </button>
        </div>

        <nav className="main-nav" aria-label="التنقل الرئيسي">
          <span className="nav-kicker">مساحة العمل</span>
          <a className="nav-item active" href="#playground"><LayoutDashboard size={18} /> المختبر <span>⌘1</span></a>
          <a className="nav-item" href="#features"><Grid2X2 size={18} /> الخصائص <span>⌘2</span></a>
          <a className="nav-item" href="#css"><Code2 size={18} /> CSS مولّد <span>⌘3</span></a>
          <span className="nav-kicker nav-kicker-spaced">استكشف</span>
          <a className="nav-item" href="#guide"><CircleHelp size={18} /> دليل الخصائص</a>
          <button className="nav-item nav-button" onClick={() => setText(samplePresets[(samplePresets.indexOf(text) + 1) % samplePresets.length])}>
            <WandSparkles size={18} /> نص تجريبي جديد
          </button>
          <a className="nav-item telegram-contact" href="https://t.me/royalvoiceowner" target="_blank" rel="noreferrer">
            <Send size={18} /> تواصل عبر تيليجرام
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="tip-icon"><Sparkles size={16} /></div>
          <div>
            <strong>جرّب المقارنة</strong>
            <p>أوقف الخاصية ثم راقب الفرق في السطر نفسه.</p>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <div className="workspace-topbar">
          <span className="workspace-title">مختبر أحمد النهر <small>OpenType</small></span>
          <div className="workspace-top-actions">
            <a className="telegram-top-button" href="https://t.me/royalvoiceowner" target="_blank" rel="noreferrer"><Send size={15} /> تواصل عبر تيليجرام</a>
            <button className="theme-toggle" type="button" onClick={() => toggleTheme?.()} aria-label={theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"} title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}>{theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}<span>{theme === "dark" ? "نهاري" : "ليلي"}</span></button>
            <div className="palette-picker">
              <button className="palette-toggle" type="button" onClick={() => setPaletteOpen((open) => !open)} aria-expanded={paletteOpen} aria-label="اختيار السمة اللونية"><Palette size={15} /><span>ألوان</span><i style={{ background: colorThemes.find((item) => item.id === colorTheme)?.swatch }} /></button>
              {paletteOpen && <div className="palette-menu">{colorThemes.map((item) => <button key={item.id} className={colorTheme === item.id ? "selected" : ""} onClick={() => { setColorTheme(item.id); setPaletteOpen(false); }}><i style={{ background: item.swatch }} /><span>{item.label}</span>{colorTheme === item.id && <Check size={12} />}</button>)}</div>}
            </div>
            <button className="utility-button workspace-reset" onClick={resetWorkspace}><RotateCcw size={15} /> إعادة ضبط</button>
          </div>
        </div>
        <section className="premium-banner" aria-label="مختبر أحمد النهر">
          <div className="premium-banner-copy">
            <div className="premium-eyebrow"><span /> مختبر عربي متقدم للخطوط <span /></div>
            <h1>مختبر أحمد النهر</h1>
            <p>اكتشف خصائص OpenType، جرّبها بصرياً، واصنع نسخة خط جاهزة للاستخدام.</p>
          </div>
          <div className="premium-banner-stats" aria-label="إحصاءات المختبر">
            <div><strong>26</strong><span>خاصية أسلوبية</span></div>
            <div><strong>3</strong><span>عائلات جاهزة</span></div>
            <div><strong>100%</strong><span>معاينة مباشرة</span></div>
          </div>
          <div className="premium-glyph premium-glyph-one">م</div>
          <div className="premium-glyph premium-glyph-two">ع</div>
        </section>
        <div className="mobile-workspace-actions">
          <button className="workspace-menu-button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={18} /> القائمة</button>
          <a className="telegram-mobile-button" href="https://t.me/royalvoiceowner" target="_blank" rel="noreferrer"><Send size={14} /> تيليجرام</a>
          <button className="theme-toggle theme-toggle-mobile" type="button" onClick={() => toggleTheme?.()} aria-label={theme === "dark" ? "تفعيل الوضع النهاري" : "تفعيل الوضع الليلي"}>{theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}<span>{theme === "dark" ? "نهاري" : "ليلي"}</span></button>
          <div className="palette-picker palette-picker-mobile">
            <button className="palette-toggle" type="button" onClick={() => setPaletteOpen((open) => !open)} aria-expanded={paletteOpen} aria-label="اختيار السمة اللونية"><Palette size={14} /><i style={{ background: colorThemes.find((item) => item.id === colorTheme)?.swatch }} /></button>
            {paletteOpen && <div className="palette-menu">{colorThemes.map((item) => <button key={item.id} className={colorTheme === item.id ? "selected" : ""} onClick={() => { setColorTheme(item.id); setPaletteOpen(false); }}><i style={{ background: item.swatch }} /><span>{item.label}</span>{colorTheme === item.id && <Check size={12} />}</button>)}</div>}
          </div>
        </div>

        <section className="content-grid">
          <div className="control-panel" id="features">
            <div className="panel-heading">
              <div>
                <span className="panel-eyebrow">OpenType FEATURES</span>
                <h2>خصائص الخط</h2>
              </div>
              <button className="round-action" onClick={() => setActiveFeatures(features.map((feature) => feature.code))} aria-label="تفعيل الكل"><Plus size={18} /></button>
            </div>

            <div className="feature-list">
              {(["أساسي", "سياقي", "أرقام", "أسلوبي"] as FeatureGroup[]).map((group) => (
                <div className="feature-group" key={group}>
                  <div className="feature-group-label">{group}</div>
                  {features.filter((feature) => feature.group === group).map((feature) => {
                    const isActive = activeFeatures.includes(feature.code);
                    return (
                      <button
                        className={`feature-row ${isActive ? "is-active" : ""} ${selectedFeature === feature.code ? "is-selected" : ""}`}
                        key={feature.code}
                        onClick={() => toggleFeature(feature.code)}
                      >
                        <span className={`feature-switch ${isActive ? "on" : ""}`} aria-hidden="true"><span /></span>
                        <span className="feature-text">
                          <span className="feature-label">{feature.label}{feature.recommended && <i>مُوصى بها</i>}</span>
                          <span className="feature-code">{feature.code}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="feature-note">
              <div className="note-icon"><Info size={17} /></div>
              <div>
                <strong>{selectedTitle}</strong>
                <p>{selectedDescription}</p>
                <span>{selectedEnglish}</span>
              </div>
            </div>
          </div>

          <div className="preview-stack">
            <section className="preview-panel">
              <div className="preview-header">
                <div className="preview-title"><Eye size={17} /><span>المعاينة الحية</span></div>
                <div className="preview-status"><span className="status-dot" /> يتحدّث مباشرة</div>
              </div>

              <div className="editor-stage">
                <div className="stage-grid" />
                <div className="type-meta"><span>{chosenFont.name}</span><span>{fontSize} PX</span></div>
                <textarea
                  aria-label="نص المعاينة"
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  className={`preview-text ${chosenFont.className}`}
                  style={{
                    fontSize: `clamp(38px, ${fontSize / 13}vw, ${fontSize}px)`,
                    lineHeight,
                    fontFamily: chosenFont.family,
                    fontFeatureSettings: featureSettings,
                    fontVariationSettings: variationSettings || undefined,
                  }}
                />
                <div className="stage-hint">انقر هنا لتحرير النص</div>
              </div>

              <div className="quick-presets">
                <span>نصوص سريعة</span>
                {samplePresets.map((preset) => (
                  <button key={preset} className={text === preset ? "chosen" : ""} onClick={() => setText(preset)}>{preset.slice(0, 14)}…</button>
                ))}
              </div>
              <div className="style-strip" aria-label="مجموعات الأساليب">
                <div className="style-strip-heading"><Sparkles size={14} /><span>كل مجموعات الأساليب</span><small>ss01—ss20</small></div>
                <div className="style-chips">
                  {stylisticSets.map((style) => {
                    const isActive = activeFeatures.includes(style.code);
                    return (
                      <button key={style.code} className={`style-chip ${isActive ? "active" : ""}`} onClick={() => toggleStyle(style.code)} aria-pressed={isActive}>
                        <span>{style.label}</span><code>{style.code}</code>{isActive && <Check size={12} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </section>

            <section className="adjustment-panel">
              <div className="adjustment-heading"><Settings2 size={17} /><span>إعدادات المعاينة</span></div>
              <div className="adjustment-grid">
                <label className="select-control">
                  <span>عائلة الخط</span>
                  <div className="select-wrap">
                    <select value={fontIndex} onChange={(event) => setFontIndex(Number(event.target.value))}>
                      {availableFonts.map((font, index) => <option value={index} key={font.name}>{font.name}</option>)}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>
                <div className="font-upload-control">
                  <span>استيراد من الجهاز</span>
                  <input ref={fontInputRef} type="file" accept=".woff,.woff2,.ttf,.otf,font/woff,font/woff2,font/ttf,font/otf" onChange={handleFontUpload} hidden />
                  <button type="button" onClick={() => fontInputRef.current?.click()}><Plus size={14} /> {uploadedFont ? "استبدال الخط" : "رفع خط"}</button>
                  {uploadedFont && <small title={uploadedFont.name}>{uploadedFont.name}</small>}
                </div>
                <div className="font-download-control">
                  <span>تنزيل الحزمة</span>
                  <button type="button" onClick={downloadConfiguredFont} disabled={!sourceFontFile || isBakingFont}><Download size={14} /> {isBakingFont ? "جاري دمج الخصائص…" : "تنزيل الخط المدمج"}</button>
                  <small>{sourceFontFile ? "إخراج TTF/OTF جاهز للاستخدام" : "ارفع خطاً أولاً"}</small>
                  {isBakingFont || exportPhase === "complete" ? (
                    <div className={`export-progress ${exportPhase === "complete" ? "is-complete" : ""}`} role="status" aria-live="polite">
                      <div className="export-progress-top"><span><LoaderCircle size={11} className={isBakingFont ? "spin" : ""} />{exportPhase === "preparing" ? "تجهيز الملف" : exportPhase === "processing" ? "دمج الخصائص على الخادم" : exportPhase === "downloading" ? "تنزيل الخط المدمج" : "اكتمل التنزيل"}</span><b>{exportProgress}%</b></div>
                      <div className="export-progress-track"><span style={{ width: `${exportProgress}%` }} /></div>
                    </div>
                  ) : null}
                </div>
                {(axisLoading || variableAxes.length > 0) && (
                  <div className="variable-axis-panel">
                    <div className="variable-axis-heading"><span>محاور الخط المتغيّر</span><small>{axisLoading ? "جاري التحليل…" : `${variableAxes.length} محاور`}</small></div>
                    {variableAxes.map((axis) => (
                      <label className="variable-axis" key={axis.tag}>
                        <span><b>{axis.tag}</b><em>{axis.tag === "wght" ? "الوزن" : axis.tag === "wdth" ? "العرض" : axis.tag === "slnt" ? "الميل" : axis.name}</em><strong>{axisValues[axis.tag] ?? axis.default}</strong></span>
                        <input type="range" min={axis.min} max={axis.max} step={(axis.max - axis.min) / 100 || 1} value={axisValues[axis.tag] ?? axis.default} onChange={(event) => setAxisValues((current) => ({ ...current, [axis.tag]: Number(event.target.value) }))} />
                        <small>{axis.min} — {axis.max}</small>
                      </label>
                    ))}
                  </div>
                )}
                <label className="slider-control">
                  <span>حجم الحرف <b>{fontSize}px</b></span>
                  <input type="range" min="34" max="96" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
                </label>
                <label className="slider-control">
                  <span>تباعد الأسطر <b>{lineHeight.toFixed(2)}</b></span>
                  <input type="range" min="1.1" max="2" step="0.05" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} />
                </label>
              </div>
              <div className={`export-note ${exportError ? "has-error" : ""}`}><Info size={14} /><span>{exportError ?? "يعالج الخادم الخط عبر FontTools ويعيد ملف TTF/OTF جديداً مع تثبيت الخصائص المختارة داخل GSUB/GPOS."}</span></div>
            </section>

            <section className="code-panel" id="css">
              <div className="code-header">
                <div><Code2 size={17} /><span>CSS الناتج</span></div>
                <button onClick={copyCSS} className={copied ? "copied" : ""}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "تم النسخ" : "نسخ الكود"}</button>
              </div>
              <pre><code>{cssSnippet}</code></pre>
            </section>
          </div>
        </section>

        <section className="guide-section" id="guide">
          <div>
            <span className="panel-eyebrow">خريطة سريعة</span>
            <h2>متى أفعّل هذه الميزات؟</h2>
          </div>
          <div className="guide-cards">
            <article><span className="guide-number">01</span><h3>للنصوص الطويلة</h3><p>ابدأ بالربطات القياسية والبدائل السياقية لتحافظ على إيقاع القراءة.</p></article>
            <article><span className="guide-number">02</span><h3>للبيانات والجداول</h3><p>فعّل الأرقام الجدولية عندما يهمّك اصطفاف القيم في الأعمدة.</p></article>
            <article><span className="guide-number">03</span><h3>للعناوين</h3><p>جرّب المجموعات الأسلوبية بحذر لإضافة شخصية من دون التضحية بالوضوح.</p></article>
          </div>
        </section>

        <footer className="page-footer">
          <span>مِحراف — مساحة صغيرة لتجارب الحرف الكبير.</span>
          <a href="#playground">العودة إلى المختبر <ArrowUpLeft size={15} /></a>
        </footer>
      </main>
    </div>
  );
}
