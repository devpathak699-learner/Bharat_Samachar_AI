"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

interface CulturalAdaptation {
  original: string;
  adapted: string;
  explanation?: string;
}

interface AudioScript {
  script_text: string;
  key_points?: string[];
  tone?: string;
  estimated_duration_seconds?: number;
}

interface SocialPosts {
  twitter: string;
  instagram: string;
  whatsapp: string;
  hashtags: string[];
  emoji_headline?: string;
}

interface Translation {
  language_code: string;
  language_name: string;
  native_name: string;
  flag: string;
  translated_title: string;
  translated_content: string;
  summary: string;
  cultural_adaptations: CulturalAdaptation[];
  audio_script: AudioScript;
  social_posts: SocialPosts;
  audio?: { audio_url?: string; duration_estimate_seconds?: number; voice_used?: string; error?: string };
}

interface FactCheck {
  credibility_score: number;
  credibility_label: string;
  credibility_color: string;
  key_claims: { claim: string; status: string; explanation: string }[];
  red_flags: string[];
  overall_assessment: string;
}

interface ArticleResults {
  article_id: string;
  source: { title: string; url: string; author: string; word_count: number; content: string };
  fact_check: FactCheck;
  translations: Translation[];
}

const SCORE_COLORS: Record<string, string> = {
  green: "#22C55E", yellow: "#F59E0B", orange: "#F97316", red: "#EF4444",
};

const RING_SIZE = 100;
const RING_STROKE = 8;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function CredibilityRing({ score, color, label }: { score: number; color: string; label: string }) {
  const c = SCORE_COLORS[color] || "#F59E0B";
  const offset = RING_CIRCUMFERENCE - (score / 100) * RING_CIRCUMFERENCE;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
      <div style={{ position: "relative", width: RING_SIZE, height: RING_SIZE }}>
        <svg width={RING_SIZE} height={RING_SIZE} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={RING_STROKE} />
          <circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RING_RADIUS} fill="none" stroke={c} strokeWidth={RING_STROKE}
            strokeDasharray={RING_CIRCUMFERENCE} strokeDashoffset={offset} strokeLinecap="round"
            style={{ transition: "stroke-dashoffset 1.5s ease" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column" }}>
          <span style={{ fontSize: "22px", fontWeight: 900, color: c }}>{score}</span>
          <span style={{ fontSize: "9px", color: "var(--text-muted)", textTransform: "uppercase" }}>/100</span>
        </div>
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700, color: c }}>{label}</span>
    </div>
  );
}

function AudioPlayer({ audioUrl, durationSec, voice }: { audioUrl: string; durationSec?: number; voice?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec || 0);

  const toggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
    else { audioRef.current.play(); setIsPlaying(true); }
  };

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

  return (
    <div style={{ background: "rgba(255,107,30,0.08)", border: "1px solid rgba(255,107,30,0.2)", borderRadius: "12px", padding: "16px" }}>
      <audio ref={audioRef} src={audioUrl}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onLoadedMetadata={() => setDuration(audioRef.current?.duration || durationSec || 0)}
        onEnded={() => setIsPlaying(false)} />
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button onClick={toggle} style={{
          width: "44px", height: "44px", borderRadius: "50%", border: "none",
          background: "var(--gradient-saffron)", cursor: "pointer",
          fontSize: "18px", display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 15px rgba(255,107,30,0.4)",
        }}>
          {isPlaying ? "⏸" : "▶️"}
        </button>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
            <span>🎙️ Amazon Polly – {voice || "Kajal (Neural)"}</span>
            <span>{fmt(currentTime)} / {fmt(duration)}</span>
          </div>
          <div style={{ background: "rgba(255,255,255,0.1)", borderRadius: "4px", height: "4px", overflow: "hidden" }}>
            <div style={{
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              height: "100%", background: "var(--gradient-saffron)", borderRadius: "4px", transition: "width 0.5s linear",
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} style={{
      padding: "6px 14px", borderRadius: "8px", border: "1px solid var(--border-color)",
      background: copied ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.04)",
      color: copied ? "#22C55E" : "var(--text-muted)", fontSize: "12px", cursor: "pointer",
      transition: "all 0.25s", fontWeight: 600,
    }}>
      {copied ? "✅ Copied!" : "📋 Copy"}
    </button>
  );
}

export default function ResultsPage() {
  const router = useRouter();
  const [data, setData] = useState<ArticleResults | null>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [activeSection, setActiveSection] = useState<"translation" | "audio" | "social" | "factcheck">("translation");

  useEffect(() => {
    const stored = sessionStorage.getItem("bharat_samachar_results");
    if (!stored) { router.push("/"); return; }
    try { setData(JSON.parse(stored)); } catch { router.push("/"); }
  }, [router]);

  if (!data) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-primary)" }}>
      <div className="spinner" style={{ width: "40px", height: "40px" }} />
    </div>
  );

  const activeTrans = data.translations[activeTab];
  const fc = data.fact_check;

  return (
    <main style={{ minHeight: "100vh", background: "var(--bg-primary)" }}>
      {/* Fixed background */}
      <div style={{ position: "fixed", top: "-20%", right: "-10%", width: "500px", height: "500px", background: "radial-gradient(circle, rgba(255,107,30,0.06) 0%, transparent 70%)", pointerEvents: "none", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1100px", margin: "0 auto", padding: "0 24px 60px" }}>
        {/* NAV */}
        <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 0", borderBottom: "1px solid var(--border-color)", marginBottom: "32px" }}>
          <button onClick={() => router.push("/")} style={{
            display: "flex", alignItems: "center", gap: "8px", background: "none", border: "none",
            color: "var(--saffron)", cursor: "pointer", fontSize: "14px", fontWeight: 700,
          }}>← New Article</button>
          <div style={{ fontWeight: 800, fontSize: "16px" }}>🇮🇳 Bharat Samachar</div>
          <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>ID: {data.article_id.slice(0, 8)}...</div>
        </nav>

        {/* ARTICLE HEADER */}
        <div style={{ marginBottom: "32px", animation: "fadeInUp 0.6s ease" }}>
          <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px" }}>
            📰 {data.source.url !== "direct-input" ? new URL(data.source.url.startsWith("http") ? data.source.url : "https://" + data.source.url).hostname : "Direct Input"}
            {" · "}{data.source.word_count} words · By {data.source.author}
          </div>
          <h1 style={{ fontSize: "clamp(22px, 4vw, 36px)", fontWeight: 900, lineHeight: 1.3, marginBottom: "16px", color: "var(--text-primary)" }}>
            {data.source.title}
          </h1>

          {/* Summary Stats */}
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {[
              { icon: "🌐", val: `${data.translations.length} Language${data.translations.length > 1 ? "s" : ""}` },
              { icon: "🛡️", val: `${fc.credibility_score}/100 Credibility` },
              { icon: "🔀", val: `${data.translations[0]?.cultural_adaptations?.length || 0} Cultural Adaptations` },
              { icon: "💾", val: "Saved to DynamoDB" },
            ].map(s => (
              <div key={s.val} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border-color)", borderRadius: "8px", padding: "6px 14px", fontSize: "13px", color: "var(--text-secondary)" }}>
                {s.icon} {s.val}
              </div>
            ))}
          </div>
        </div>

        {/* LANGUAGE TABS */}
        <div style={{ display: "flex", gap: "8px", marginBottom: "24px", overflowX: "auto", paddingBottom: "4px" }}>
          {data.translations.map((trans, i) => (
            <button key={trans.language_code}
              onClick={() => setActiveTab(i)}
              className={`lang-tab ${activeTab === i ? "active" : "inactive"}`}>
              {trans.flag} {trans.language_name}
              <span style={{ fontSize: "11px", opacity: 0.7, marginLeft: "4px" }}>({trans.native_name})</span>
            </button>
          ))}
        </div>

        {/* SECTION TABS */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "24px", background: "rgba(255,255,255,0.03)", padding: "4px", borderRadius: "10px", width: "fit-content" }}>
          {([
            { key: "translation", icon: "🌐", label: "Translation" },
            { key: "audio", icon: "🎙️", label: "Audio" },
            { key: "social", icon: "📱", label: "Social" },
            { key: "factcheck", icon: "🛡️", label: "Fact Check" },
          ] as const).map(tab => (
            <button key={tab.key} onClick={() => setActiveSection(tab.key)}
              style={{
                padding: "8px 16px", borderRadius: "8px", border: "none", cursor: "pointer",
                fontSize: "13px", fontWeight: 600, transition: "all 0.25s",
                background: activeSection === tab.key ? "var(--gradient-saffron)" : "transparent",
                color: activeSection === tab.key ? "white" : "var(--text-muted)",
              }}>
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* ── TRANSLATION SECTION ── */}
        {activeSection === "translation" && activeTrans && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", animation: "fadeInUp 0.5s ease" }}>
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                🇺🇸 Original (English)
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px", lineHeight: 1.4 }}>{data.source.title}</h2>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8, maxHeight: "400px", overflowY: "auto", whiteSpace: "pre-wrap" }}>
                {data.source.content || "Article content not available."}
              </div>
            </div>

            {/* Translation */}
            <div className="glass-card" style={{ padding: "24px", borderColor: "rgba(255,107,30,0.2)" }}>
              <div style={{ fontSize: "12px", color: "var(--saffron)", marginBottom: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px" }}>
                🇮🇳 {activeTrans.language_name} ({activeTrans.native_name})
              </div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "12px", lineHeight: 1.4, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {activeTrans.translated_title}
              </h2>
              <div style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.8, maxHeight: "400px", overflowY: "auto", fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: "pre-wrap" }}>
                {activeTrans.translated_content || activeTrans.summary}
              </div>
            </div>

            {/* Cultural Adaptations */}
            {activeTrans.cultural_adaptations.length > 0 && (
              <div className="glass-card" style={{ padding: "24px", gridColumn: "1 / -1" }}>
                <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--saffron-light)", marginBottom: "16px" }}>
                  🔀 Cultural Adaptations Made ({activeTrans.cultural_adaptations.length})
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeTrans.cultural_adaptations.map((adapt, i) => (
                    <div key={i} className="adaptation-chip" title={adapt.explanation || ""}>
                      <span style={{ color: "#F87171", textDecoration: "line-through" }}>{adapt.original}</span>
                      <span style={{ fontSize: "10px" }}>→</span>
                      <span style={{ color: "var(--green-light)" }}>{adapt.adapted}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Summary */}
            {activeTrans.summary && (
              <div className="glass-card" style={{ padding: "24px", gridColumn: "1 / -1", background: "rgba(255,107,30,0.04)", borderColor: "rgba(255,107,30,0.15)" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--saffron-light)", marginBottom: "10px" }}>📋 Summary in {activeTrans.language_name}</div>
                <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.8, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                  {activeTrans.summary}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── AUDIO SECTION ── */}
        {activeSection === "audio" && activeTrans && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div className="glass-card" style={{ padding: "32px", maxWidth: "700px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>🎙️ Audio Podcast – {activeTrans.language_name}</h3>
              <p style={{ color: "var(--text-muted)", fontSize: "14px", marginBottom: "16px" }}>
                Generated by Amazon Polly using Kajal Neural voice (Indian voice model)
              </p>

              {/* Warning for non-Hindi languages */}
              {activeTrans.language_code !== "hi" && (
                <div style={{
                  background: "rgba(245,158,11,0.08)",
                  border: "1px solid rgba(245,158,11,0.3)",
                  borderRadius: "10px",
                  padding: "10px 14px",
                  marginBottom: "16px",
                  fontSize: "13px",
                  color: "#F59E0B",
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                }}>
                  <span>⚠️</span>
                  <span>
                    <strong>Note:</strong> Amazon Polly’s native Indian voice (Kajal) only supports Hindi.
                    The {activeTrans.language_name} script is read using the Hindi voice as a prototype fallback.
                    Native {activeTrans.language_name} audio support is planned for Phase 2.
                  </span>
                </div>
              )}

              {activeTrans.audio?.audio_url ? (
                <AudioPlayer
                  audioUrl={activeTrans.audio.audio_url}
                  durationSec={activeTrans.audio.duration_estimate_seconds}
                  voice={activeTrans.audio.voice_used}
                />
              ) : (
                <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: "12px", padding: "16px", color: "#F87171", fontSize: "14px" }}>
                  ⚠️ {activeTrans.audio?.error || "Audio not available. Ensure AWS credentials and S3 bucket are configured."}
                </div>
              )}

              {/* Script */}
              {activeTrans.audio_script?.script_text && (
                <div style={{ marginTop: "24px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "12px" }}>
                    📝 News Script (30-second bulletin)
                  </div>
                  <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-color)", borderRadius: "10px", padding: "16px" }}>
                    <p style={{ fontSize: "15px", lineHeight: 1.8, color: "var(--text-primary)", fontFamily: "'Noto Sans Devanagari', sans-serif", whiteSpace: "pre-wrap" }}>
                      {activeTrans.audio_script.script_text}
                    </p>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "12px", alignItems: "center" }}>
                      <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                        ⏱️ {activeTrans.audio_script.estimated_duration_seconds || 30}s · Tone: {activeTrans.audio_script.tone || "informative"}
                      </span>
                      <CopyButton text={activeTrans.audio_script.script_text} />
                    </div>
                  </div>
                </div>
              )}

              {/* Key Points */}
              {activeTrans.audio_script?.key_points && activeTrans.audio_script.key_points.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-secondary)", marginBottom: "10px" }}>🔑 Key Points</div>
                  {activeTrans.audio_script.key_points.map((pt, i) => (
                    <div key={i} style={{ display: "flex", gap: "10px", padding: "8px 0", borderBottom: "1px solid var(--border-color)", fontSize: "14px", color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--saffron)", fontWeight: 700 }}>{i + 1}.</span> {pt}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SOCIAL SECTION ── */}
        {activeSection === "social" && activeTrans && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", animation: "fadeInUp 0.5s ease" }}>
            {/* Twitter */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>🐦 Twitter / X</div>
                <CopyButton text={activeTrans.social_posts?.twitter || ""} />
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {activeTrans.social_posts?.twitter}
              </p>
              <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "10px" }}>
                {activeTrans.social_posts?.twitter?.length || 0} / 280 chars
              </div>
            </div>

            {/* Instagram */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>📸 Instagram</div>
                <CopyButton text={activeTrans.social_posts?.instagram || ""} />
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {activeTrans.social_posts?.instagram}
              </p>
            </div>

            {/* WhatsApp */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ fontWeight: 700, fontSize: "15px" }}>💬 WhatsApp</div>
                <CopyButton text={activeTrans.social_posts?.whatsapp || ""} />
              </div>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: 1.7, fontFamily: "'Noto Sans Devanagari', sans-serif" }}>
                {activeTrans.social_posts?.whatsapp}
              </p>
            </div>

            {/* Hashtags */}
            {activeTrans.social_posts?.hashtags && (
              <div className="glass-card" style={{ padding: "24px", gridColumn: "1 / -1" }}>
                <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "12px" }}>🏷️ Hashtags</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                  {activeTrans.social_posts.hashtags.map((tag, i) => (
                    <span key={i} style={{ background: "rgba(255,107,30,0.1)", border: "1px solid rgba(255,107,30,0.25)", borderRadius: "20px", padding: "4px 14px", fontSize: "13px", color: "var(--saffron-light)", fontWeight: 600 }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── FACT CHECK SECTION ── */}
        {activeSection === "factcheck" && (
          <div style={{ animation: "fadeInUp 0.5s ease" }}>
            <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "20px" }}>
              {/* Score Ring */}
              <div className="glass-card" style={{ padding: "32px", display: "flex", flexDirection: "column", alignItems: "center", gap: "16px" }}>
                <CredibilityRing score={fc.credibility_score} color={fc.credibility_color} label={fc.credibility_label} />
                <div style={{ fontSize: "13px", color: "var(--text-muted)", textAlign: "center" }}>
                  Powered by Claude 3 Sonnet fact analysis
                </div>
                {fc.recommended_sources && (
                  <div style={{ width: "100%", borderTop: "1px solid var(--border-color)", paddingTop: "16px" }}>
                    <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>Verify With</div>
                    {fc.recommended_sources.map((s: string, i: number) => (
                      <div key={i} style={{ fontSize: "13px", color: "var(--text-secondary)", padding: "2px 0" }}>📌 {s}</div>
                    ))}
                  </div>
                )}
              </div>

              {/* Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Assessment */}
                <div className="glass-card" style={{ padding: "20px" }}>
                  <div style={{ fontWeight: 700, marginBottom: "8px", fontSize: "15px" }}>📋 Overall Assessment</div>
                  <p style={{ color: "var(--text-secondary)", lineHeight: 1.8, fontSize: "14px" }}>{fc.overall_assessment}</p>
                </div>

                {/* Claims */}
                {fc.key_claims && fc.key_claims.length > 0 && (
                  <div className="glass-card" style={{ padding: "20px" }}>
                    <div style={{ fontWeight: 700, marginBottom: "16px", fontSize: "15px" }}>🔍 Key Claims Analysis</div>
                    {fc.key_claims.map((claim, i) => {
                      const statusColors: Record<string, string> = {
                        "Likely True": "#22C55E", "Needs Verification": "#F59E0B", "Potentially False": "#EF4444",
                      };
                      const col = statusColors[claim.status] || "#8B9CC8";
                      return (
                        <div key={i} style={{ padding: "12px", marginBottom: "8px", background: "rgba(255,255,255,0.02)", border: `1px solid ${col}30`, borderRadius: "10px", borderLeft: `3px solid ${col}` }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px", marginBottom: "6px" }}>
                            <span style={{ fontSize: "14px", color: "var(--text-primary)", flex: 1 }}>{claim.claim}</span>
                            <span style={{ fontSize: "11px", fontWeight: 700, color: col, whiteSpace: "nowrap", padding: "2px 8px", background: `${col}20`, borderRadius: "10px" }}>{claim.status}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>{claim.explanation}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Red Flags */}
                {fc.red_flags && fc.red_flags.length > 0 && (
                  <div className="glass-card" style={{ padding: "20px", borderColor: "rgba(239,68,68,0.2)" }}>
                    <div style={{ fontWeight: 700, marginBottom: "12px", fontSize: "15px", color: "#F87171" }}>⚠️ Red Flags</div>
                    {fc.red_flags.map((flag, i) => (
                      <div key={i} style={{ fontSize: "14px", color: "var(--text-secondary)", padding: "4px 0", display: "flex", gap: "8px" }}>
                        <span style={{ color: "#F87171" }}>•</span> {flag}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
