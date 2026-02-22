import { Github, Music2, Wand2, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: Wand2,
    title: "AI Composition",
    description:
      "Generate melodies, chord progressions, and full arrangements from a prompt.",
  },
  {
    icon: Music2,
    title: "Studio-Grade Mixing",
    description:
      "Professional multi-track editor with EQ, compression, and spatial audio built in.",
  },
  {
    icon: Zap,
    title: "Real-Time Collaboration",
    description:
      "Co-produce with your team anywhere in the world — zero latency, zero compromise.",
  },
] as const;

export default function Home(): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* ── Nav ──────────────────────────────────────────────── */}
      <header className="sticky top-0 z-[var(--z-overlay)] border-b border-border/60 bg-background/80 backdrop-blur-md">
        <nav
          className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4"
          aria-label="Primary navigation"
        >
          <a
            href="/"
            className="flex items-center gap-2 font-semibold tracking-tight text-foreground"
            aria-label="daw-ai home"
          >
            <Music2 className="size-5 text-primary" aria-hidden="true" />
            <span>daw-ai</span>
          </a>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="View source on GitHub"
              >
                <Github className="size-4" aria-hidden="true" />
                GitHub
              </a>
            </Button>
            <Button size="sm">Get started</Button>
          </div>
        </nav>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <main id="main-content">
        <section
          className="mx-auto flex max-w-4xl flex-col items-center gap-8 px-6 py-24 text-center sm:py-36"
          aria-labelledby="hero-heading"
        >
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-sm text-muted-foreground">
            <Zap className="size-3.5 text-primary" aria-hidden="true" />
            Now in public beta
          </div>

          <h1
            id="hero-heading"
            className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Make music with{" "}
            <span className="text-primary">artificial intelligence</span>
          </h1>

          <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
            daw-ai is a browser-native digital audio workstation supercharged by
            generative AI. Compose, mix, and master without limits.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button size="lg" className="min-w-40">
              Start for free
            </Button>
            <Button size="lg" variant="outline" className="min-w-40">
              Watch demo
            </Button>
          </div>
        </section>

        {/* ── Features ─────────────────────────────────────────── */}
        <section
          className="border-t border-border bg-muted/30 px-6 py-24"
          aria-labelledby="features-heading"
        >
          <div className="mx-auto max-w-6xl">
            <h2
              id="features-heading"
              className="mb-14 text-center text-3xl font-bold tracking-tight"
            >
              Everything you need to create
            </h2>

            <ul className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li
                  key={title}
                  className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-sm)] transition-shadow duration-[var(--duration-base)] hover:shadow-[var(--shadow-md)]"
                >
                  <div className="mb-4 inline-flex size-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="size-5 text-primary" aria-hidden="true" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold">{title}</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────── */}
        <section
          className="px-6 py-24 text-center"
          aria-labelledby="cta-heading"
        >
          <div className="mx-auto max-w-2xl">
            <h2
              id="cta-heading"
              className="mb-4 text-3xl font-bold tracking-tight"
            >
              Ready to compose?
            </h2>
            <p className="mb-8 text-muted-foreground">
              Join thousands of producers already using daw-ai. Free forever, no
              credit card required.
            </p>
            <Button size="lg">Create your first track</Button>
          </div>
        </section>
      </main>

      {/* ── Footer ───────────────────────────────────────────── */}
      <footer className="border-t border-border px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} daw-ai. All rights reserved.</p>
          <nav aria-label="Footer navigation">
            <ul className="flex gap-6">
              <li>
                <a
                  href="/privacy"
                  className="transition-colors hover:text-foreground"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="transition-colors hover:text-foreground"
                >
                  Terms
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </footer>
    </div>
  );
}
