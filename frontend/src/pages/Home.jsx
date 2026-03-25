import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { Globe, Newspaper, Radar, CloudLightning, ArrowRight } from 'lucide-react';

const features = [
  {
    title: 'Live Global Map',
    description: 'Monitor real-time disaster alerts worldwide using interactive satellite tools.',
    icon: Globe,
    link: '/livemap',
    color: 'bg-teal-500',
  },
  {
    title: 'Verified News Feed',
    description: 'Aggregated news coverage from top trusted sources covering active incidents.',
    icon: Newspaper,
    link: '/news',
    color: 'bg-blue-500',
  },
  {
    title: 'AI News Detection',
    description: 'Paste social media content to detect fake news and verify disaster context.',
    icon: Radar,
    link: '/detection',
    color: 'bg-purple-500',
  },
  {
    title: 'Weather Forecast',
    description: 'Hyper-local weather predictions and extreme condition warnings.',
    icon: CloudLightning,
    link: '/forecast',
    color: 'bg-red-500',
  },
];

function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3800);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const ok = toast.type === "success";

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[200] -translate-x-1/2 px-4"
      role="status"
    >
      <div
        className={[
          "rounded-xl border px-5 py-3 text-sm font-medium shadow-card backdrop-blur-md",
          ok
            ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-100"
            : "border-red-500/40 bg-red-950/90 text-red-100",
        ].join(" ")}
      >
        {toast.message}
      </div>
    </div>
  );
}

export default function Home() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);
  const [toast, setToast] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      const res = await fetch("http://localhost:8000/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("bad status");
      setToast({ type: "success", message: "Message sent — we'll get back to you soon." });
      setForm({ name: "", email: "", message: "" });
    } catch {
      setToast({ type: "error", message: "Could not send your message. Try again shortly." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-[#060b13] text-slate-100 overflow-x-hidden">
      <Toast toast={toast} onDismiss={() => setToast(null)} />

      {/* Hero Section with Video Background */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 lg:px-12 pt-24 pb-12 overflow-hidden bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072')" }}>
        {/* Using the user's uploaded local video background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072"
          className="absolute top-0 left-0 w-full h-full object-cover z-0 opacity-90"
        >
          <source src="/bg.mp4" type="video/mp4" />
        </video>
        <div className="absolute top-0 left-0 w-full h-full bg-black/60 z-0" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[40vh] bg-teal-500/20 blur-[120px] rounded-full pointer-events-none z-10" />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="relative text-center max-w-4xl mx-auto z-20 my-16"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="inline-block px-4 py-1.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-teal-300 text-sm font-semibold mb-6 tracking-wide uppercase shadow-[0_0_15px_rgba(45,212,191,0.2)]"
          >
            Intelligence at the Speed of Crisis
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-100 to-slate-400 leading-tight mb-8 drop-shadow-lg">
            Real-Time Disaster<br />Intelligence Platform
          </h1>

          <p className="text-lg md:text-xl text-slate-300 mb-10 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
            Aggregating critical data from satellites, real-time weather APIs, and social media to keep you ahead of emergencies. Monitor, analyze, and act immediately.
          </p>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="inline-block">
            <NavLink
              to="/livemap"
              className="flex items-center gap-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white px-8 py-4 rounded-full font-bold text-lg shadow-xl shadow-teal-500/20 transition-all group"
            >
              Launch Live Map
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </NavLink>
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <div className="relative z-20 w-full max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.1, duration: 0.6 }}
              className="h-full"
            >
              <NavLink
                to={feature.link}
                className="group block p-6 rounded-3xl bg-slate-900/60 border border-slate-800/60 hover:border-slate-700/80 hover:bg-slate-800/60 backdrop-blur-xl transition-all shadow-lg hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden h-full"
              >
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-lg ${feature.color} bg-opacity-20 backdrop-blur-md border border-white/10`}>
                  <feature.icon className={`w-7 h-7 ${feature.color.replace('bg-', 'text-')} opacity-90`} />
                </div>
                <h3 className="text-xl font-bold text-white mb-3 tracking-tight group-hover:text-teal-300 transition-colors">{feature.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">{feature.description}</p>
              </NavLink>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Contact Form Section */}
      <section className="relative z-20 px-4 py-20 sm:px-6 bg-[#060b13] border-t border-white/5">
        <div className="mx-auto max-w-lg">
          <div className="rounded-[1.5rem] border border-white/10 bg-slate-900/60 p-8 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <h2 className="text-center text-3xl font-extrabold text-white tracking-tight">Contact us</h2>
            <p className="mt-3 text-center text-[15px] text-slate-400">
              Reach the team for partnerships, demos, or data questions.
            </p>
            <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
              <input
                required
                placeholder="Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-5 py-3.5 text-white outline-none ring-teal-500/30 placeholder:text-slate-500 focus:ring-2 transition-all"
              />
              <input
                required
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full rounded-xl border border-white/10 bg-slate-800/50 px-5 py-3.5 text-white outline-none ring-teal-500/30 placeholder:text-slate-500 focus:ring-2 transition-all"
              />
              <textarea
                required
                placeholder="Message"
                rows={4}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                className="w-full resize-y rounded-xl border border-white/10 bg-slate-800/50 px-5 py-3.5 text-white outline-none ring-teal-500/30 placeholder:text-slate-500 focus:ring-2 transition-all"
              />
              <button
                type="submit"
                disabled={sending}
                className="relative mt-2 w-full overflow-hidden rounded-xl bg-gradient-to-r from-teal-600 to-teal-500 py-4 text-sm font-bold tracking-wide text-white shadow-lg shadow-teal-500/20 transition enabled:hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
              >
                {sending ? "Sending…" : "Send message"}
              </button>
            </form>
          </div>
        </div>
      </section>

    </div>
  );
}
