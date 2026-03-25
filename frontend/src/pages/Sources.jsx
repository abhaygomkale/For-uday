const sources = [
  {
    name: "Reddit API",
    icon: "📡",
    desc: "Community discussions and breaking threads scoped by city and disaster keywords for supplemental signal.",
    status: "Active",
  },
  {
    name: "OpenWeather API",
    icon: "🌦",
    desc: "Live conditions, humidity, wind, and risk heuristics when you focus a city on the map.",
    status: "Active",
  },
  {
    name: "News & incident feed",
    icon: "📰",
    desc: "Structured incident records from the CrisisLens data pipeline (GDACs / EONET and curated posts in the backend).",
    status: "Active",
  },
  {
    name: "Groq LLM",
    icon: "🤖",
    desc: "Fast conversational assistant for summarizing context, with optional weather grounding from the selected map city.",
    status: "Active",
  },
];

export default function Sources() {
  return (
    <div className="min-h-0 flex-1 bg-crisis-bg px-4 py-12 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold text-white">Data transparency</h1>
        <p className="mt-3 text-slate-400">
          CrisisLens is upfront about where intelligence originates. Each integration is opt-in via configuration on the backend—this page is a read-only overview for operators and stakeholders.
        </p>

        <div className="mt-12 grid gap-6 sm:grid-cols-2">
          {sources.map((s) => (
            <div
              key={s.name}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 shadow-card backdrop-blur-xl transition duration-300 hover:border-cyan-400/20 hover:shadow-glow"
            >
              <div className="flex items-start gap-4">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 text-2xl">
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-white">{s.name}</h2>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {s.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
