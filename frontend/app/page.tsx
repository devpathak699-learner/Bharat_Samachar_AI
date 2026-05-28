"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

const LANGUAGES = [
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", speakers: "528M" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳", speakers: "75M" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳", speakers: "265M" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳", speakers: "83M" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳", speakers: "81M" },
];

const EXAMPLE_URLS = [
  "https://timesofindia.indiatimes.com/india",
  "https://www.thehindu.com/news/national/",
  "https://indianexpress.com/",
];

const STEPS = [
  { id: 1, icon: "📰", label: "Extracting Article Content" },
  { id: 2, icon: "🔍", label: "Running Fact-Check Analysis" },
  { id: 3, icon: "🌐", label: "Cultural AI Translation (Bedrock)" },
  { id: 4, icon: "🎙️", label: "Generating Audio (Amazon Polly)" },
  { id: 5, icon: "💾", label: "Saving to DynamoDB" },
];

export default function HomePage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [pastedText, setPastedText] = useState("");
  const [inputMode, setInputMode] = useState<"url" | "text">("url");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(["hi"]);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const toggleLang = (code: string) => {
    setSelectedLangs(prev =>
      prev.includes(code) ? prev.filter(l => l !== code) : [...prev, code]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const input = inputMode === "url" ? url.trim() : pastedText.trim();
    if (!input) { setError("Please provide a news article URL or paste some text."); return; }
    if (selectedLangs.length === 0) { setError("Please select at least one language."); return; }

    setIsProcessing(true);
    setCurrentStep(1);

    // Animate steps
    let step = 1;
    intervalRef.current = setInterval(() => {
      step++;
      if (step <= STEPS.length) {
        setCurrentStep(step);
      } else {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    }, 3000);

    try {
      const payload: Record<string, unknown> = {
        languages: selectedLangs,
        generate_audio: generateAudio,
      };
      if (inputMode === "url") payload.url = input;
      else payload.text = input;

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || err.error || "Failed to process article");
      }

      const data = await res.json();
      if (intervalRef.current) clearInterval(intervalRef.current);
      setCurrentStep(STEPS.length + 1);

      // Store results and navigate
      sessionStorage.setItem("bharat_samachar_results", JSON.stringify(data));
      setTimeout(() => router.push("/results"), 500);
    } catch (err: unknown) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setIsProcessing(false);
      setCurrentStep(0);
      const msg = err instanceof Error ? err.message : "An error occurred";
      setError(msg.includes("fetch") ? "Cannot connect to backend. Is the server running on port 8000?" : msg);
    }
  };

  if (!mounted) return null;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)", position: "relative", overflow: "hidden" }}>
      {/* Background orbs */}
      <div style={{
        position: "fixed", top: "-20%", right: "-10%", width: "600px", height: "600px",
        background: "radial-gradient(circle, rgba(255,107,30,0.08) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />
      <div style={{
        position: "fixed", bottom: "-20%", left: "-10%", width: "500px", height: "500px",
        background: "radial-gradient(circle, rgba(19,136,8,0.06) 0%, transparent 70%)",
        pointerEvents: "none", zIndex: 0,
      }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "0 24px" }}>
        {/* NAVBAR */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "24px 0", borderBottom: "1px solid var(--border-color)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "40px", height: "40px", borderRadius: "10px",
              background: "var(--gradient-saffron)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "20px",
            }}>🇮🇳</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: "18px", color: "var(--text-primary)" }}>Bharat Samachar</div>
              <div style={{ fontSize: "11px", color: "var(--saffron)", letterSpacing: "1px", textTransform: "uppercase" }}>भारत समाचार</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <div style={{ background: "rgba(19,136,8,0.15)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: "20px", padding: "4px 12px", fontSize: "12px", color: "#22C55E" }}>
              ⚡ AWS Bedrock Powered
            </div>
          </div>
        </nav>

        {/* HERO */}
        <section style={{ textAlign: "center", padding: "60px 0 40px", animation: "fadeInUp 0.8s ease" }}>
          <div style={{
            display: "inline-block", background: "rgba(255,107,30,0.1)", border: "1px solid rgba(255,107,30,0.3)",
            borderRadius: "30px", padding: "6px 18px", fontSize: "13px", color: "var(--saffron-light)",
            marginBottom: "24px", letterSpacing: "0.5px",
          }}>
            🌐 Bridging India's Language Barrier — One Article at a Time
          </div>

          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "20px" }}>
            <span style={{ color: "var(--text-primary)" }}>News for Every </span>
            <span className="tricolor-text">भारतीय</span>
          </h1>

          <p style={{ fontSize: "18px", color: "var(--text-secondary)", maxWidth: "600px", margin: "0 auto 16px", lineHeight: 1.7 }}>
            AI doesn&apos;t just translate — it <strong style={{ color: "var(--text-primary)" }}>culturally adapts</strong> content into
            <strong style={{ color: "var(--saffron)" }}> Indian languages</strong>.
            &ldquo;Super Bowl&rdquo; becomes &ldquo;IPL Final&rdquo;. &ldquo;Black Friday&rdquo; becomes &ldquo;दिवाली Sale&rdquo;.
          </p>

          {/* Stats */}
          <div style={{ display: "flex", gap: "32px", justifyContent: "center", flexWrap: "wrap", margin: "32px 0" }}>
            {[
              { num: "5", label: "Indian Languages" },
              { num: "AWS", label: "Bedrock Powered" },
              { num: "~30s", label: "Per Article" },
              { num: "6-in-1", label: "Features per Article" },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "28px", fontWeight: 800, color: "var(--saffron)" }}>{stat.num}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* MAIN FORM */}
        <section style={{ maxWidth: "780px", margin: "0 auto 60px", animation: "fadeInUp 0.8s 0.2s ease both" }}>
          <div className="glass-card" style={{ padding: "36px" }}>
            {!isProcessing ? (
              <form onSubmit={handleSubmit}>
                {/* Input mode toggle */}
                <div style={{ display: "flex", gap: "8px", marginBottom: "24px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
                  {(["url", "text"] as const).map(mode => (
                    <button key={mode} type="button"
                      onClick={() => setInputMode(mode)}
                      style={{
                        padding: "8px 20px", borderRadius: "8px", border: "none", cursor: "pointer",
                        fontSize: "14px", fontWeight: 600, transition: "all 0.25s",
                        background: inputMode === mode ? "var(--gradient-saffron)" : "transparent",
                        color: inputMode === mode ? "white" : "var(--text-muted)",
                      }}>
                      {mode === "url" ? "🔗 Article URL" : "📝 Paste Text"}
                    </button>
                  ))}
                </div>

                {/* URL Input */}
                {inputMode === "url" ? (
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 600 }}>
                      News Article URL
                    </label>
                    <input
                      type="url"
                      className="input-primary"
                      value={url}
                      onChange={e => setUrl(e.target.value)}
                      placeholder="https://timesofindia.indiatimes.com/india/..."
                      required={inputMode === "url"}
                    />
                    <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>Try: </span>
                      {EXAMPLE_URLS.map(eu => (
                        <button key={eu} type="button" onClick={() => setUrl(eu)}
                          style={{ fontSize: "12px", color: "var(--saffron)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                          {new URL(eu).hostname}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div style={{ marginBottom: "24px" }}>
                    <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "8px", fontWeight: 600 }}>
                      Paste Article Text
                    </label>
                    <textarea
                      className="input-primary"
                      value={pastedText}
                      onChange={e => setPastedText(e.target.value)}
                      placeholder="Paste the full news article text here. First line will be used as the title..."
                      rows={6}
                      style={{ resize: "vertical", lineHeight: 1.6 }}
                      required={inputMode === "text"}
                    />
                  </div>
                )}

                {/* Language Selection */}
                <div style={{ marginBottom: "24px" }}>
                  <label style={{ display: "block", fontSize: "14px", color: "var(--text-secondary)", marginBottom: "12px", fontWeight: 600 }}>
                    Target Languages ({selectedLangs.length} selected)
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {LANGUAGES.map(lang => {
                      const active = selectedLangs.includes(lang.code);
                      return (
                        <button key={lang.code} type="button" onClick={() => toggleLang(lang.code)}
                          style={{
                            display: "flex", alignItems: "center", gap: "8px",
                            padding: "10px 16px", borderRadius: "10px", cursor: "pointer",
                            border: `1.5px solid ${active ? "var(--saffron)" : "var(--border-color)"}`,
                            background: active ? "rgba(255,107,30,0.12)" : "rgba(255,255,255,0.02)",
                            color: active ? "var(--saffron-light)" : "var(--text-secondary)",
                            fontWeight: 600, fontSize: "14px", transition: "all 0.25s",
                          }}>
                          {active && <span style={{ color: "var(--green-light)" }}>✓</span>}
                          <span style={{ fontSize: "18px" }}>{lang.flag}</span>
                          <div style={{ textAlign: "left" }}>
                            <div>{lang.name}</div>
                            <div style={{ fontSize: "11px", opacity: 0.7 }}>{lang.native} • {lang.speakers}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Options */}
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "28px", padding: "14px", background: "rgba(255,255,255,0.02)", borderRadius: "10px" }}>
                  <button type="button"
                    onClick={() => setGenerateAudio(!generateAudio)}
                    style={{
                      width: "44px", height: "24px", borderRadius: "12px", border: "none",
                      background: generateAudio ? "var(--gradient-saffron)" : "rgba(255,255,255,0.1)",
                      cursor: "pointer", position: "relative", transition: "all 0.3s",
                    }}>
                    <div style={{
                      width: "18px", height: "18px", background: "white", borderRadius: "50%",
                      position: "absolute", top: "3px",
                      left: generateAudio ? "23px" : "3px", transition: "left 0.3s",
                    }} />
                  </button>
                  <div>
                    <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>🎙️ Generate Audio (Amazon Polly)</div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>Creates Hindi audio podcast using neural voice (Kajal)</div>
                  </div>
                </div>

                {error && (
                  <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", color: "#F87171", fontSize: "14px" }}>
                    ❌ {error}
                  </div>
                )}

                <button type="submit" className="btn-primary glow-btn" style={{ width: "100%", fontSize: "18px", padding: "16px" }}>
                  🚀 Process Article with AI
                </button>

                <p style={{ textAlign: "center", fontSize: "12px", color: "var(--text-muted)", marginTop: "12px" }}>
                  Powered by Amazon Bedrock (Claude 3 Sonnet) • Amazon Polly • DynamoDB • S3
                </p>
              </form>
            ) : (
              /* PROCESSING STATE */
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "48px", marginBottom: "16px", animation: "float 2s ease-in-out infinite" }}>🇮🇳</div>
                <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "8px" }}>Processing Your Article</h2>
                <p style={{ color: "var(--text-muted)", marginBottom: "32px", fontSize: "14px" }}>
                  AWS Bedrock (Claude 3 Sonnet) is culturally adapting your content...
                </p>

                {/* Progress steps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", textAlign: "left", maxWidth: "400px", margin: "0 auto 32px" }}>
                  {STEPS.map((step, i) => {
                    const state = currentStep > i + 1 ? "done" : currentStep === i + 1 ? "active" : "pending";
                    return (
                      <div key={step.id} className={`step-indicator ${state}`}>
                        {state === "done" ? "✅" : state === "active" ? <span className="spinner" /> : step.icon}
                        <span style={{ marginLeft: "8px" }}>{step.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar */}
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", background: "var(--gradient-saffron)",
                    width: `${(currentStep / STEPS.length) * 100}%`,
                    transition: "width 3s ease",
                    borderRadius: "4px",
                  }} />
                </div>
                <div style={{ marginTop: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                  {Math.round((currentStep / STEPS.length) * 100)}% complete
                </div>
              </div>
            )}
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section style={{ padding: "0 0 80px", animation: "fadeInUp 0.8s 0.4s ease both" }}>
          <h2 style={{ textAlign: "center", fontSize: "28px", fontWeight: 800, marginBottom: "40px" }}>
            How It Works
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            {[
              { icon: "🔗", title: "Paste URL", desc: "Share any news article link from TOI, The Hindu, NDTV..." },
              { icon: "🧠", title: "Bedrock AI", desc: "Claude 3 Sonnet culturally adapts idioms and references" },
              { icon: "🌐", title: "5 Languages", desc: "Hindi, Tamil, Bengali, Marathi, Telugu in one click" },
              { icon: "🎙️", title: "Polly Audio", desc: "Neural Indian voice reads your article aloud" },
              { icon: "🛡️", title: "Fact-Check", desc: "Credibility score powered by Claude AI analysis" },
              { icon: "📱", title: "Social Posts", desc: "Twitter, Instagram, WhatsApp ready captions" },
            ].map(item => (
              <div key={item.title} className="glass-card" style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: "32px", marginBottom: "12px" }}>{item.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "15px" }}>{item.title}</div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* CULTURAL EXAMPLE */}
        <section style={{ padding: "0 0 80px" }}>
          <div className="glass-card" style={{ padding: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px", textAlign: "center" }}>
              🔥 Cultural AI – Not Just Translation
            </h3>
            <p style={{ textAlign: "center", color: "var(--text-muted)", marginBottom: "28px", fontSize: "14px" }}>
              Unlike Google Translate, we adapt cultural context to make content truly relatable
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
              {[
                { en: '"Stock market crashed like dominoes"', hi: '"शेयर बाज़ार ताश के पत्तों की तरह बिखर गया"', label: "Literal → Cultural" },
                { en: '"Super Bowl excitement"', hi: '"IPL Final जैसा उत्साह"', label: "US Sport → Indian Sport" },
                { en: '"Black Friday deals"', hi: '"दिवाली Sale जैसे ऑफर"', label: "US Holiday → Indian Festival" },
              ].map(ex => (
                <div key={ex.en} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-color)", borderRadius: "12px", padding: "16px" }}>
                  <div style={{ fontSize: "11px", color: "var(--saffron)", letterSpacing: "1px", textTransform: "uppercase", marginBottom: "10px", fontWeight: 700 }}>{ex.label}</div>
                  <div style={{ fontSize: "13px", color: "#F87171", marginBottom: "8px", fontStyle: "italic" }}>❌ {ex.en}</div>
                  <div style={{ fontSize: "13px", color: "var(--green-light)", fontStyle: "italic" }}>✅ {ex.hi}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
