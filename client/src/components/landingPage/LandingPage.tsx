import React, { useEffect, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  LayoutGrid,
  Users,
  MessageSquare,
  Activity,
  Gauge,
  Building2,
  Search,
  Bell,
  ArrowRight,
  Check,
  FolderKanban
} from "lucide-react";

const C = {
  bg: "#111113",
  surface: "#1a1a1c",
  border: "#2a2a2c",
  accent: "#7f77dd",
  accentDeep: "#534ab7",
} as const;

/* ------------------------------------------------------------------ */
/*  Animation variants                                                 */
/* ------------------------------------------------------------------ */
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

const stagger: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

/* ------------------------------------------------------------------ */
/*  Reusable primitives                                                */
/* ------------------------------------------------------------------ */
type BtnProps = {
  href: string;
  children: React.ReactNode;
  variant?: "filled" | "ghost" | "outline";
  className?: string;
};

const Button: React.FC<BtnProps> = ({
  href,
  children,
  variant = "filled",
  className = "",
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-colors";
  const styles: Record<NonNullable<BtnProps["variant"]>, string> = {
    filled: "bg-[#7f77dd] text-white hover:bg-[#6d65d4]",
    ghost: "text-zinc-300 hover:text-white hover:bg-white/5",
    outline:
      "border border-[#2a2a2c] text-zinc-200 hover:border-[#7f77dd]/60 hover:text-white",
  };
  return (
    <motion.a
      href={href}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </motion.a>
  );
};

const Logo: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`font-bold tracking-tight ${className}`}>
    Ship<span className="text-[rgb(129,52,254)]">It</span>
  </span>
);

/* ------------------------------------------------------------------ */
/*  1. Navbar                                                          */
/* ------------------------------------------------------------------ */
const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`fixed top-0 z-50 w-full transition-all ${
        scrolled
          ? "border-b border-[#2a2a2c] bg-[#111113]/80 backdrop-blur-md"
          : "border-b border-transparent"
      }`}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo className="text-xl text-white" />
        <div className="flex items-center gap-2">
          <Button href="/login" variant="ghost">
            Log in
          </Button>
          <Button href="/register" variant="filled">
            Get Started
          </Button>
        </div>
      </nav>
    </motion.header>
  );
};

/* ------------------------------------------------------------------ */
/*  Kanban mockup (shared by Hero + Showcase)                          */
/* ------------------------------------------------------------------ */
type Priority = "urgent" | "high" | "medium";

const priorityStyles: Record<Priority, string> = {
  urgent: "bg-red-500/15 text-red-400 border-red-500/30",
  high: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  medium: "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

type Card = {
  title: string;
  priority: Priority;
  initials: string;
  forYou?: boolean;
  unread?: number;
};

const MockCard: React.FC<{ card: Card }> = ({ card }) => (
  <div className="rounded-lg border border-[#2a2a2c] bg-[#111113] p-3">
    
    <p className="mb-3 text-sm font-medium text-zinc-200">{card.title}</p>
     <div className="flex justify-between"> 
    <div className="mb-2 flex items-center gap-2">
      <span
        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium capitalize ${priorityStyles[card.priority]}`}
      >
        {card.priority}
      </span>
      {card.forYou && (
        <span className="rounded border border-[#7f77dd]/40 bg-[#7f77dd]/15 px-1.5 py-0.5 text-[10px] font-medium text-[#a39bff]">
          For you
        </span>
      )}
    </div>
    <div className="flex items-center justify-between">
    
      {card.unread ? (
        <div className="flex items-center gap-1 relative">
          <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
          <span className=" absolute -top-2 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
            {card.unread}
          </span>
        </div>
      ) : null}
    </div>
     </div>
  </div>
);

type Column = { name: string; count: number; cards: Card[] };

const boardData: Column[] = [
  {
    name: "To Do",
    count: 2,
    cards: [
      { title: "Design onboarding flow", priority: "high", initials: "GG", forYou: true },
      { title: "Set up CI pipeline", priority: "medium", initials: "AK" },
    ],
  },
  {
    name: "In Progress",
    count: 2,
    cards: [
      { title: "Fix realtime socket drop", priority: "urgent", initials: "GG", unread: 3 },
      { title: "Build dashboard widgets", priority: "high", initials: "MR" },
    ],
  },
  {
    name: "In Review ",
    count: 1,
    cards: [{ title: "Code review for new feature", priority: "high", initials: "JD" }],
  },
  {
    name: "Done",
    count: 1,
    cards: [{ title: "Workspace invites", priority: "medium", initials: "AK" }],
  },
];

const KanbanMockup: React.FC<{ withSidebar?: boolean }> = ({
  withSidebar = true,
}) => (
  <div className="overflow-hidden rounded-xl border border-[#2a2a2c] bg-[#1a1a1c] shadow-2xl">
    {/* window chrome */}
    <div className="flex items-center gap-1.5 border-b border-[#2a2a2c] px-4 py-3">
      <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-amber-500/70" />
      <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
    </div>

    <div className="flex">
      {/* sidebar */}
      {withSidebar && (
        <aside className="hidden w-48 shrink-0 border-r border-[#2a2a2c] p-4 sm:block">
          <div className="mb-4 flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[#534ab7] text-xs font-bold text-white">
              S
            </div>
            <span className="text-sm font-semibold text-white">
              Acme Team
            </span>
          </div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
            Projects
          </p>
          <ul className="space-y-1 text-sm">
            {["Product", "Marketing", "Design"].map((p, i) => (
              <li
                key={p}
                className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                  i === 0
                    ? "bg-[#7f77dd]/15 text-white"
                    : "text-zinc-400"
                }`}
              >
                <FolderKanban className="h-3.5 w-3.5" />
                {p}
              </li>
            ))}
          </ul>
        </aside>
      )}

      {/* board */}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-4 gap-3 p-4">
        {boardData.map((col) => (
          <div key={col.name} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">
                {col.name}
              </span>
              <span className="text-xs text-zinc-500">{col.count}</span>
            </div>
            {col.cards.map((card) => (
              <MockCard key={card.title} card={card} />
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);

/* ------------------------------------------------------------------ */
/*  2. Hero                                                            */
/* ------------------------------------------------------------------ */
const headline = ["Ship faster.", "Together."];

const Hero: React.FC = () => (
  <section className="relative overflow-hidden px-6 pt-36 pb-20">
    {/* ambient glow */}
    <div
      aria-hidden
      className="pointer-events-none absolute left-1/2 top-0 h-120 w-170 -translate-x-1/2 rounded-full opacity-30 blur-[120px]"
      style={{ background: C.accentDeep }}
    />
    <div className="relative mx-auto max-w-4xl text-center">
      <motion.h1
        variants={stagger}
        initial="hidden"
        animate="show"
        className="text-5xl font-bold tracking-tight text-white sm:text-7xl"
      >
        {headline.map((line) => (
          <motion.span key={line} variants={fadeUp} className="block">
            {line === "Together." ? (
              <span className="text-[#7f77dd]">{line}</span>
            ) : (
              line
            )}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.4 }}
        className="mx-auto mt-6 max-w-xl text-lg text-zinc-400"
      >
        ShipIt is the real-time command center where your team plans, tracks,
        and ships work together — every board, comment, and update live, with
        zero refreshing.
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
        className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row"
      >
        <Button href="/register" variant="filled">
          Get Started Free <ArrowRight className="h-4 w-4" />
        </Button>
        <Button href="#features" variant="outline">
          See how it works
        </Button>
      </motion.div>
    </div>

    
  </section>
);

/* ------------------------------------------------------------------ */
/*  3. Social proof                                                    */
/* ------------------------------------------------------------------ */
const stack = ["React", "TypeScript", "Node.js", "MongoDB", "Socket.io"];

const SocialProof: React.FC = () => (
  <section className="border-y border-[#2a2a2c] px-6 py-10">
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-5">
      <p className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Built with a modern real-time stack
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
        {stack.map((s) => (
          <span key={s} className="text-sm font-medium text-zinc-400">
            {s}
          </span>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  4. Features                                                        */
/* ------------------------------------------------------------------ */
type Feature = {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
};

const features: Feature[] = [
  { icon: LayoutGrid, title: "Real-time boards", desc: "Drag cards across columns and every teammate sees it instantly. No refresh." },
  { icon: Users, title: "Live collaboration", desc: "See who's online in your workspace right now." },
  { icon: MessageSquare, title: "Card comments", desc: "Every card has its own message thread with live updates." },
  { icon: Activity, title: "Activity logs", desc: "A full history of every action across your board, updated in real time." },
  { icon: Gauge, title: "Smart dashboard", desc: "Assigned cards, urgent items, board health, and recent activity the moment you log in." },
  { icon: Building2, title: "Workspace management", desc: "Create workspaces, invite members, manage roles, and handle join requests." },
  { icon: Search, title: "Search & filter", desc: "Find any card instantly. Filter by assignee or urgency." },
  { icon: Bell, title: "Notifications", desc: "Get notified when cards move, messages arrive, or join requests come in." },
];

const Features: React.FC = () => (
  <section id="features" className="px-6 py-24">
    <div className="mx-auto max-w-6xl">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="text-center text-4xl font-bold tracking-tight text-white"
      >
        Everything your team needs
      </motion.h2>
      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mx-auto mt-4 max-w-xl text-center text-zinc-400"
      >
        One focused workspace for planning, tracking, and shipping — built to
        feel instant.
      </motion.p>

      <motion.div
        variants={stagger}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {features.map((f) => (
          <motion.div
            key={f.title}
            variants={fadeUp}
            className="rounded-xl border border-[#2a2a2c] bg-[#1a1a1c] p-5 transition-colors hover:border-[#7f77dd]/40"
          >
            <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-[#7f77dd]/15">
              <f.icon className="h-5 w-5 text-[#a39bff]" />
            </div>
            <h3 className="mb-1.5 text-base font-semibold text-white">
              {f.title}
            </h3>
            <p className="text-sm leading-relaxed text-zinc-400">{f.desc}</p>
          </motion.div>
        ))}
      </motion.div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  5. How it works                                                    */
/* ------------------------------------------------------------------ */
const steps: { title: string; desc: string }[] = [
  { title: "Create a workspace", desc: "Spin up a workspace and invite your team in seconds." },
  { title: "Build your board", desc: "Create cards, then assign and prioritize the work." },
  { title: "Ship", desc: "Drag, collaborate, and track everything in real time." },
];

const HowItWorks: React.FC = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-5xl">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="text-center text-4xl font-bold tracking-tight text-white"
      >
        How it works
      </motion.h2>

      <div className="relative mt-16 grid grid-cols-1 gap-10 md:grid-cols-3">
        {/* connecting line */}
        <div
          aria-hidden
          className="absolute left-0 right-0 top-7 hidden h-px bg-linear-to-r from-transparent via-[#2a2a2c] to-transparent md:block"
        />
        {steps.map((s, i) => (
          <motion.div
            key={s.title}
            variants={fadeUp}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="relative text-center"
          >
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#2a2a2c] bg-[#1a1a1c] text-xl font-bold text-[#7f77dd]">
              {i + 1}
            </div>
            <h3 className="mb-2 text-lg font-semibold text-white">{s.title}</h3>
            <p className="mx-auto max-w-xs text-sm text-zinc-400">{s.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  6. Kanban showcase                                                 */
/* ------------------------------------------------------------------ */
const Showcase: React.FC = () => (
  <section className="px-6 py-24">
    <div className="mx-auto max-w-6xl">
      <motion.h2
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="text-center text-4xl font-bold tracking-tight text-white"
      >
        Your board, alive
      </motion.h2>
      <motion.p
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
        className="mx-auto mb-14 mt-4 max-w-xl text-center text-zinc-400"
      >
        Priorities, assignees, threads, and live updates — all in one calm,
        fast interface.
      </motion.p>

      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true }}
      >
        <KanbanMockup withSidebar />
      </motion.div>
    </div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  7. CTA                                                             */
/* ------------------------------------------------------------------ */
const CTA: React.FC = () => (
  <section className="px-6 py-24">
    <motion.div
      variants={fadeUp}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
      className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl border border-[#2a2a2c] bg-[#1a1a1c] px-6 py-16 text-center"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-25 blur-[100px]"
        style={{ background: C.accent }}
      />
      <div className="relative">
        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Ready to ship?
        </h2>
        <p className="mx-auto mt-4 max-w-md text-zinc-400">
          Bring your team into one real-time workspace and start moving work
          forward today.
        </p>
        <div className="mt-8 flex justify-center">
          <Button href="/register" variant="filled" className="px-6 py-3 text-base">
            Get Started Free <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
        <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-zinc-500">
          <Check className="h-3.5 w-3.5 text-[#7f77dd]" />
          No credit card required — free to use
        </p>
      </div>
    </motion.div>
  </section>
);

/* ------------------------------------------------------------------ */
/*  8. Footer                                                          */
/* ------------------------------------------------------------------ */
const Footer: React.FC = () => (
  <footer className="border-t border-[#2a2a2c] px-6 py-10">
    <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
      <div className="flex items-center gap-3">
        <Logo className="text-lg text-white" />
        <span className="text-sm text-zinc-500">
          The real-time command center for shipping teams.
        </span>
      </div>
      <a
        href="https://www.linkedin.com/"
        target="_blank"
        rel="noreferrer"
        className="text-sm text-zinc-500 transition-colors hover:text-zinc-300"
      >
        Built by Gosa Girma
      </a>
    </div>
  </footer>
);

/* ------------------------------------------------------------------ */
/*  Root                                                               */
/* ------------------------------------------------------------------ */
const LandingPage: React.FC = () => (
  <div className="min-h-screen bg-[#111113] font-sans text-white antialiased">
    <Navbar />
    <main>
      <Hero />
      <Showcase />
      <SocialProof />
      <Features />
      <HowItWorks />
      
      <CTA />
    </main>
    <Footer />
  </div>
);

export default LandingPage;
