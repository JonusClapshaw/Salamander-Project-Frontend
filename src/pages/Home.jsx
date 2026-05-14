export default function Home() {
  return (
    <section className="space-y-6 md:space-y-8">
      <div className="rounded-md border border-app-border bg-white/80 px-6 py-10 text-center shadow-soft md:px-12">
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Salamander Tracker</h1>
        <p className="mx-auto mt-3 max-w-xl text-base text-app-muted md:text-lg">
          Build and review motion analysis sessions with the same structure shown in your wireframes.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.2fr_1fr] md:items-stretch">
        <div className="rounded-md border border-app-border bg-white p-4 shadow-soft">
          <img
            src="https://cdn.britannica.com/64/239564-050-522E431D/Western-tiger-salamander-Ambystoma-mavortium.jpg"
            alt="Salamander sample"
            className="h-full min-h-64 w-full rounded object-cover"
          />
        </div>
        <div className="rounded-md border border-app-border bg-gradient-to-br from-app-sand to-app-amber/60 p-6 shadow-soft">
          <h2 className="text-2xl font-semibold">Start Workflow</h2>
          <p className="mt-2 text-app-muted">
            Use Videos to choose a recording, then continue to Preview for tuning and processing.
          </p>
          <a
            href="/videos"
            className="mt-6 inline-block rounded-md border border-app-ink bg-app-ink px-4 py-2 text-white transition hover:-translate-y-0.5"
          >
            Open Video List
          </a>
        </div>
      </div>
    </section>
  );
}