export default function HomePage() {
  return (
    <main className="min-h-screen bg-ink text-paper">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-center px-6 py-16">
        <p className="mb-6 text-sm font-semibold uppercase tracking-[0.24em] text-signal">
          Adaptive English learning
        </p>
        <h1 className="max-w-4xl text-5xl font-black leading-tight md:text-7xl">
          A precise AI tutor that learns how you learn.
        </h1>
        <p className="mt-8 max-w-2xl text-lg leading-8 text-paper/75">
          Diagnostic assessment, adaptive lessons, speaking practice, and progress analytics are
          being assembled into one coherent learning workspace.
        </p>
      </section>
    </main>
  );
}
