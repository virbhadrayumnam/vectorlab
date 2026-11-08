import { useEffect, useRef, useState } from "react";
import {
  defaultTraceSettings,
  traceImage,
  type TraceSettings,
  type TracePreset,
} from "./lib/trace";

type TraceStatus = "idle" | "tracing" | "ready" | "error";

function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [originalUrl, setOriginalUrl] = useState("");
  const [svgUrl, setSvgUrl] = useState("");
  const [svgText, setSvgText] = useState("");
  const [settings, setSettings] = useState<TraceSettings>(defaultTraceSettings);
  const [status, setStatus] = useState<TraceStatus>("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    if (!file) {
      setOriginalUrl("");
      return;
    }
    const url = URL.createObjectURL(file);
    setOriginalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!svgText) {
      setSvgUrl("");
      return;
    }
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    setSvgUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [svgText]);

  const updateSetting = (key: keyof TraceSettings, value: number) => {
    setSettings((current) => ({ ...current, [key]: value }));
  };

  const selectFile = (nextFile?: File) => {
    if (!nextFile) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(nextFile.type)) {
      setError("Choose a PNG, JPEG, or WebP image.");
      return;
    }
    setFile(nextFile);
    setSvgText("");
    setError("");
    setStatus("idle");
    setShowOriginal(false);
  };

  const runTrace = async () => {
    if (!file) return;
    setStatus("tracing");
    setError("");
    try {
      const result = await traceImage(file, settings);
      setSvgText(result);
      setStatus("ready");
    } catch (traceError) {
      setError(traceError instanceof Error ? traceError.message : "Tracing failed. Please try another image.");
      setStatus("error");
    }
  };

  const downloadSvg = () => {
    if (!svgText) return;
    const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    const baseName = file?.name.replace(/\.[^.]+$/, "") || "vectorlab-artwork";
    anchor.href = url;
    anchor.download = baseName + ".svg";
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const reset = () => {
    setFile(null);
    setSvgText("");
    setError("");
    setStatus("idle");
    if (inputRef.current) inputRef.current.value = "";
  };

  const formatSize = (bytes: number) =>
    bytes < 1024 * 1024 ? (bytes / 1024).toFixed(0) + " KB" : (bytes / (1024 * 1024)).toFixed(2) + " MB";

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="VectorLab home">
          <span className="brand-mark">V</span>
          <span>vector<span className="brand-light">lab</span></span>
        </a>
        <div className="topbar-right">
          <span className="local-badge"><i /> Runs locally</span>
          <a className="github-link" href="https://github.com/virbhadrayumnam/vectorlab" target="_blank" rel="noreferrer">GitHub ↗</a>
        </div>
      </header>

      <main className="main-content">
        <section className="intro">
          <div className="eyebrow">MITRANG TECHNOLOGIES PRESENTS</div>
          <h1>Turn pixels into <span>possibilities.</span></h1>
          <p>A simple, private workspace to transform raster images into clean, scalable SVG artwork.</p>
        </section>

        {!file ? (
          <section
            className={"dropzone" + (dragging ? " is-dragging" : "")}
            onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              selectFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              className="file-input"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event) => selectFile(event.target.files?.[0])}
            />
            <div className="upload-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 16V4m0 0L7 9m5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" /></svg></div>
            <h2>Drop your image here</h2>
            <p>or browse files from your device</p>
            <button className="primary-button" onClick={() => inputRef.current?.click()}>Choose an image</button>
            <div className="file-hint">PNG, JPG or WebP <span>·</span> Processed on your device</div>
          </section>
        ) : (
          <section className="workspace">
            <div className="workspace-heading">
              <div>
                <div className="eyebrow">WORKSPACE</div>
                <h2>{file.name}</h2>
                <span className="file-meta">{formatSize(file.size)} · {file.type.split("/")[1].toUpperCase()}</span>
              </div>
              <button className="text-button" onClick={reset}>Remove image</button>
            </div>

            <div className="work-grid">
              <section className="preview-panel">
                <div className="panel-heading">
                  <span>PREVIEW</span>
                  {svgText && (
                    <div className="toggle-group">
                      <button className={!showOriginal ? "selected" : ""} onClick={() => setShowOriginal(false)}>Vector</button>
                      <button className={showOriginal ? "selected" : ""} onClick={() => setShowOriginal(true)}>Original</button>
                    </div>
                  )}
                </div>
                <div className="preview-stage">
                  {showOriginal || !svgUrl ? (
                    <img src={originalUrl} alt="Original uploaded artwork" className="preview-image" />
                  ) : (
                    <img src={svgUrl} alt="Vectorized SVG preview" className="preview-image" />
                  )}
                  {status === "tracing" && <div className="preview-overlay"><span className="spinner" />Tracing your image…</div>}
                </div>
                <div className="preview-footer">
                  <span>{svgText ? "SVG preview generated" : "Original image"}</span>
                  {svgText && <span>{(new Blob([svgText]).size / 1024).toFixed(1)} KB SVG</span>}
                </div>
              </section>

              <aside className="settings-panel">
                <div className="panel-heading"><span>TRACE SETTINGS</span><button className="reset-settings" onClick={() => setSettings(defaultTraceSettings)}>Reset</button></div>
                <div className="setting preset-setting">
                  <div className="setting-label"><span>Quality preset</span><output>Recommended</output></div>
                  <div className="preset-options" role="group" aria-label="Tracing quality preset">
                    {([
                      ["logo", "Logo", "Clean edges and flat colours"],
                      ["illustration", "Illustration", "Artwork and drawings"],
                      ["photo", "Photo", "Shaded and detailed images"],
                    ] as [TracePreset, string, string][]).map(([value, label, description]) => (
                      <button
                        key={value}
                        className={settings.preset === value ? "preset-option selected" : "preset-option"}
                        onClick={() => setSettings((current) => ({ ...current, preset: value }))}
                        aria-pressed={settings.preset === value}
                        title={description}
                      >{label}</button>
                    ))}
                  </div>
                  <p className="preset-description">
                    {settings.preset === "logo" ? "Reduces colour noise, cleans transparency and prioritises crisp shapes." :
                      settings.preset === "illustration" ? "Keeps more tonal detail while filtering tiny stray pixels." :
                      "Preserves more shading and tonal variation in photographs."}
                  </p>
                </div>
                <div className="setting">
                  <div className="setting-label"><label htmlFor="colors">Colours</label><output>{settings.colors}</output></div>
                  <input id="colors" type="range" min="2" max="32" step="1" value={settings.colors} onChange={(e) => updateSetting("colors", Number(e.target.value))} />
                  <div className="range-hint"><span>Fewer</span><span>More detail</span></div>
                </div>
                <div className="setting">
                  <div className="setting-label"><label htmlFor="detail">Detail threshold</label><output>{settings.detail.toFixed(1)}</output></div>
                  <input id="detail" type="range" min="0.1" max="5" step="0.1" value={settings.detail} onChange={(e) => updateSetting("detail", Number(e.target.value))} />
                  <div className="range-hint"><span>Fine</span><span>Simplified</span></div>
                </div>
                <div className="setting">
                  <div className="setting-label"><label htmlFor="smoothness">Curve smoothness</label><output>{settings.smoothness.toFixed(1)}</output></div>
                  <input id="smoothness" type="range" min="0.1" max="5" step="0.1" value={settings.smoothness} onChange={(e) => updateSetting("smoothness", Number(e.target.value))} />
                  <div className="range-hint"><span>Precise</span><span>Smooth</span></div>
                </div>
                <div className="setting">
                  <div className="setting-label"><label htmlFor="paths">Path filtering</label><output>{settings.pathOmit}</output></div>
                  <input id="paths" type="range" min="0" max="32" step="1" value={settings.pathOmit} onChange={(e) => updateSetting("pathOmit", Number(e.target.value))} />
                  <div className="range-hint"><span>Keep details</span><span>Remove noise</span></div>
                </div>
                <div className="settings-note"><span>✳</span> Higher colour counts and finer detail can increase processing time and SVG size.</div>
                <button className="primary-button trace-button" onClick={runTrace} disabled={status === "tracing"}>
                  {status === "tracing" ? <><span className="button-spinner" />Tracing…</> : svgText ? "Regenerate SVG" : "Trace image"}
                </button>
                {svgText && <button className="download-button" onClick={downloadSvg}>↓ <span>Download SVG</span></button>}
                {error && <div className="error-message" role="alert">{error}</div>}
              </aside>
            </div>
          </section>
        )}

        {error && !file && <div className="error-message upload-error" role="alert">{error}</div>}

        <section className="benefits">
          <div><span className="benefit-icon">◈</span><strong>Private by design</strong><p>Your images stay on your device.</p></div>
          <div><span className="benefit-icon">⌁</span><strong>Scalable output</strong><p>Export artwork as SVG.</p></div>
          <div><span className="benefit-icon">⟡</span><strong>Free and open source</strong><p>Built in the open by Mitrang.</p></div>
        </section>
      </main>
      <footer><span>VECTORLAB <span className="footer-dot">•</span> AN OPEN SOURCE PROJECT</span><span>Made by <a href="https://mitrang.com" target="_blank" rel="noreferrer">Mitrang Technologies</a></span></footer>
    </div>
  );
}

export default App;
