import { useMemo, useState } from "react";
import {
  ArrowUpLeft,
  Check,
  ChevronDown,
  CircleHelp,
  Code2,
  Copy,
  Eye,
  Grid2X2,
  Info,
  LayoutDashboard,
  Menu,
  Plus,
  RotateCcw,
  Settings2,
  Sparkles,
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

export default function Home() {
  const [activeFeatures, setActiveFeatures] = useState<string[]>(["liga", "rlig", "calt"]);
  const [selectedFeature, setSelectedFeature] = useState("liga");
  const [fontIndex, setFontIndex] = useState(0);
  const [fontSize, setFontSize] = useState(64);
  const [lineHeight, setLineHeight] = useState(1.45);
  const [text, setText] = useState(samplePresets[0]);
  const [copied, setCopied] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const selected = features.find((feature) => feature.code === selectedFeature) ?? features[0];
  const chosenFont = fontOptions[fontIndex];

  const featureSettings = useMemo(
    () => activeFeatures.map((code) => `"${code}" 1`).join(", ") || "normal",
    [activeFeatures],
  );

  const cssSnippet = useMemo(
    () => `.your-text {\n  font-family: ${chosenFont.family};\n  font-size: ${fontSize}px;\n  line-height: ${lineHeight};\n  font-feature-settings: ${featureSettings};\n}`,
    [chosenFont, featureSettings, fontSize, lineHeight],
  );

  function toggleFeature(code: string) {
    setSelectedFeature(code);
    setActiveFeatures((current) =>
      current.includes(code) ? current.filter((item) => item !== code) : [...current, code],
    );
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
            <div className="brand-name">مِحراف</div>
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
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)} aria-label="فتح القائمة"><Menu size={21} /></button>
          <div className="crumbs">
            <span>مساحة العمل</span>
            <span className="crumb-separator">/</span>
            <strong>مختبر الخصائص</strong>
          </div>
          <div className="topbar-actions">
            <button className="utility-button" onClick={resetWorkspace}><RotateCcw size={17} /> إعادة ضبط</button>
            <button className="help-button" aria-label="مساعدة"><CircleHelp size={19} /></button>
            <div className="avatar">هـ</div>
          </div>
        </header>

        <section className="hero" id="playground">
          <div className="hero-art" aria-hidden="true">
            <div className="type-orb orb-one">ع</div>
            <div className="type-orb orb-two">ط</div>
            <div className="type-orb orb-three">م</div>
            <div className="hero-arc" />
          </div>
          <div className="hero-copy">
            <div className="eyebrow"><span /> مختبر تفاعلي للكتابة العربية</div>
            <h1>دع الحرف<br /><em>يتنفّس.</em></h1>
            <p>استعرض خصائص OpenType وفعّلها لحظةً بلحظة. كل تعديل يظهر مباشرة في النص، ثم يتحول إلى CSS جاهز للاستخدام.</p>
          </div>
          <div className="hero-stat">
            <div className="stat-line"><span>الخصائص المفعّلة</span><strong>{activeFeatures.length.toString().padStart(2, "0")}</strong></div>
            <div className="stat-track"><span style={{ width: `${Math.max(17, activeFeatures.length * 12.5)}%` }} /></div>
            <small>من أصل {features.length} ميزات متاحة</small>
          </div>
        </section>

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
                <strong>{selected.label}</strong>
                <p>{selected.description}</p>
                <span>{selected.english}</span>
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
            </section>

            <section className="adjustment-panel">
              <div className="adjustment-heading"><Settings2 size={17} /><span>إعدادات المعاينة</span></div>
              <div className="adjustment-grid">
                <label className="select-control">
                  <span>عائلة الخط</span>
                  <div className="select-wrap">
                    <select value={fontIndex} onChange={(event) => setFontIndex(Number(event.target.value))}>
                      {fontOptions.map((font, index) => <option value={index} key={font.name}>{font.name}</option>)}
                    </select>
                    <ChevronDown size={16} />
                  </div>
                </label>
                <label className="slider-control">
                  <span>حجم الحرف <b>{fontSize}px</b></span>
                  <input type="range" min="34" max="96" value={fontSize} onChange={(event) => setFontSize(Number(event.target.value))} />
                </label>
                <label className="slider-control">
                  <span>تباعد الأسطر <b>{lineHeight.toFixed(2)}</b></span>
                  <input type="range" min="1.1" max="2" step="0.05" value={lineHeight} onChange={(event) => setLineHeight(Number(event.target.value))} />
                </label>
              </div>
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
