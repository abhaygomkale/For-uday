import { useState } from "react";

export default function Chatbot({ open, setOpen, selectedWeather, selectedCity }) {
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hi! Ask about disasters 🌍" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);

  const session_id = "demo-session";

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const text = input.trim();
    const userMsg = { sender: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setSending(true);

    let weatherContext = "";
    if (selectedCity && selectedWeather) {
      weatherContext = `${selectedCity.city}: ${selectedWeather.condition} (${selectedWeather.temp}°C, humidity ${selectedWeather.humidity}%), risk level: ${selectedWeather.risk_level}`;
    }

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          session_id,
          weather_context: weatherContext,
        }),
      });

      const data = await res.json();

      setMessages((prev) => [...prev, { sender: "bot", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Error connecting to AI." },
      ]);
    }

    setSending(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={[
          "fixed bottom-6 right-6 z-[1100] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-2xl text-white shadow-glow-lg transition hover:scale-105 hover:shadow-glow active:scale-95",
          open ? "pointer-events-none opacity-0" : "opacity-100",
        ].join(" ")}
        aria-label="Open AI assistant"
      >
        🤖
      </button>

      <div
        className={[
          "fixed inset-0 z-[1040] bg-slate-950/40 backdrop-blur-[2px] transition-opacity lg:hidden",
          open ? "opacity-100" : "pointer-events-none opacity-0",
        ].join(" ")}
        onClick={() => setOpen(false)}
        aria-hidden
      />

      <aside
        className={[
          "fixed top-0 right-0 z-[1050] flex h-full w-80 max-w-[100vw] flex-col border-l border-cyan-500/15 bg-slate-950/95 text-slate-100 shadow-[-8px_0_40px_rgba(0,0,0,0.45)] backdrop-blur-xl transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "translate-x-full pointer-events-none",
        ].join(" ")}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <span className="text-sm font-semibold text-white">🤖 AI assistant</span>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded-lg px-2 py-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={[
                "max-w-[90%] rounded-2xl px-3 py-2 text-sm leading-relaxed",
                m.sender === "user"
                  ? "ml-auto bg-gradient-to-br from-cyan-600 to-blue-700 text-white shadow-md"
                  : "mr-auto border border-white/10 bg-white/5 text-slate-200",
              ].join(" ")}
            >
              {m.text}
            </div>
          ))}
          {sending && (
            <div className="mr-auto rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
              Thinking…
            </div>
          )}
        </div>

        <div className="border-t border-white/10 p-3">
          <div className="flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about an event…"
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-900/80 px-3 py-2.5 text-sm text-white outline-none ring-cyan-500/20 placeholder:text-slate-500 focus:ring-2"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={sending}
              className="shrink-0 rounded-xl bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:opacity-50"
            >
              ➤
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
