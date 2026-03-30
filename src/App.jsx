import { useMemo, useState } from "react";
import { motion } from "framer-motion";

const spring = {
  type: "spring",
  stiffness: 95,
  damping: 16,
  mass: 0.72
};

export default function App() {
  const [isDark, setIsDark] = useState(true);

  const theme = useMemo(
    () =>
      isDark
        ? {
            shell: "bg-[#070204] text-[#f6f2f4]",
            sub: "text-[#cdbfc5]",
            border: "border-white/25",
            panel: "bg-white/[0.05]",
            heroFill: "text-white/18",
            line: "from-[#6d001a]/35 via-[#6d001a] to-[#6d001a]/35",
            backdrop:
              "bg-[radial-gradient(circle_at_15%_12%,rgba(166,35,71,0.34),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(109,0,26,0.38),transparent_35%),linear-gradient(170deg,#070204,#110307_65%,#050204)]"
          }
        : {
            shell: "bg-[#f8f0ed] text-[#21181c]",
            sub: "text-[#6b515a]",
            border: "border-black/30",
            panel: "bg-black/[0.04]",
            heroFill: "text-black/20",
            line: "from-[#6d001a]/30 via-[#6d001a] to-[#6d001a]/30",
            backdrop:
              "bg-[radial-gradient(circle_at_15%_12%,rgba(166,35,71,0.2),transparent_35%),radial-gradient(circle_at_82%_18%,rgba(109,0,26,0.16),transparent_35%),linear-gradient(170deg,#f8efec,#f4e9e6_65%,#f5ebe8)]"
          },
    [isDark]
  );

  return (
    <div className={`relative min-h-screen overflow-hidden transition-colors duration-500 ${theme.shell}`}>
      <div className={`pointer-events-none absolute inset-0 ${theme.backdrop}`} />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:42px_42px] opacity-40" />

      <header className="absolute left-0 right-0 top-0 z-20 px-4 pt-4 md:px-8 md:pt-6">
        <div className={`mx-auto grid max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-2 rounded-full border ${theme.border} ${theme.panel} px-3 py-2 backdrop-blur-xl md:px-4`}>
          <span className="justify-self-start rounded-full border border-current/35 px-4 py-2 text-sm font-black tracking-[0.05em]">RAJ.</span>

          <button
            type="button"
            onClick={() => setIsDark((prev) => !prev)}
            className={`rounded-full border ${theme.border} px-4 py-2 text-[0.65rem] font-bold uppercase tracking-[0.16em] transition-all duration-500 ease-spring md:px-6 md:text-xs`}
          >
            CHANGE THE MODE
          </button>

          <button
            type="button"
            aria-label="Open menu"
            className={`justify-self-end rounded-full border ${theme.border} px-4 py-[0.82rem]`}
          >
            <span className="mx-auto block h-[2px] w-5 rounded-full bg-current" />
            <span className="mx-auto mt-[6px] block h-[2px] w-5 rounded-full bg-current" />
          </button>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-[1500px] items-center justify-center px-4 pb-16 pt-28 md:px-8 md:pb-20 md:pt-24">
        <section className="relative h-[80vh] min-h-[620px] w-full">
          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, duration: 0.5 }}
            className={`pointer-events-none absolute left-1/2 top-[54%] z-[1] w-full -translate-x-1/2 -translate-y-1/2 text-center font-['Inter_Tight'] text-[clamp(2.25rem,14.5vw,14.2rem)] font-black uppercase leading-[0.8] tracking-[-0.03em] ${theme.heroFill}`}
          >
            RAJVERDHAN SINGH
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, x: -24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.06, duration: 0.5 }}
            className="absolute left-[3%] top-[24%] z-[5] font-['Playfair_Display'] text-[clamp(1.35rem,5vw,4.4rem)] italic"
          >
            I&apos;M
          </motion.p>

          <motion.p
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ ...spring, delay: 0.1, duration: 0.5 }}
            className="absolute right-[3%] top-[33%] z-[5] text-right font-['Playfair_Display'] text-[clamp(1rem,3.8vw,3.2rem)] italic"
          >
            AI/ML ENGINEER
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...spring, delay: 0.15, duration: 0.5 }}
            className="absolute left-1/2 top-[56%] z-[3] -translate-x-1/2 -translate-y-1/2"
          >
            <motion.a
              href="#"
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute -bottom-5 left-1/2 z-[7] -translate-x-1/2 rounded-full border border-white/35 bg-gradient-to-r from-[#a61543] to-[#6d001a] px-8 py-3 text-xs font-extrabold uppercase tracking-[0.18em] text-white shadow-[0_0_24px_rgba(109,0,26,0.55)]"
            >
              LET&apos;S CHAT
            </motion.a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.2, duration: 0.5 }}
            className="absolute bottom-0 left-0 right-0 z-[8] flex items-end justify-between gap-6 px-1 md:px-2"
          >
            <p className={`max-w-[60ch] text-[0.63rem] uppercase tracking-[0.22em] md:text-[0.74rem] ${theme.sub}`}>
              AI/ML Engineer with practical experience in Data Structures, Algorithms, API architecture
            </p>

            <p className={`max-w-[24ch] text-right text-sm leading-relaxed md:text-base ${theme.sub}`}>VINI VIDI VICI</p>
          </motion.div>
        </section>
      </main>

      <div className={`fixed bottom-0 left-0 right-0 z-30 h-[10px] bg-gradient-to-r ${theme.line}`} />
    </div>
  );
}
