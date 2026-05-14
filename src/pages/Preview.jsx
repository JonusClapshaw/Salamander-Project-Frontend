import { Link, useParams } from 'react-router-dom';

export default function Preview() {
  const { filename } = useParams();

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-app-border bg-white/85 px-5 py-10 shadow-soft">
        <div className="grid gap-3 md:grid-cols-[1fr_2fr] md:items-center">
          <div className="text-xl font-medium text-app-muted md:text-2xl">Home, Videos, status</div>
          <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">Header</h1>
        </div>
      </div>

      <div className="max-w-md rounded-md border border-app-border bg-white px-4 py-2 shadow-soft">
        <label htmlFor="threshold" className="mb-1 block text-sm font-medium text-app-muted">
          Slider
        </label>
        <input
          id="threshold"
          type="range"
          min="0"
          max="100"
          defaultValue="40"
          className="w-full accent-app-blue"
        />
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-app-border bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-app-panel/40 text-center text-app-muted md:h-96">
            Thumbnail / frame preview
          </div>
          <button className="w-full border-t border-app-border bg-white py-3 text-2xl font-medium transition hover:bg-app-panel/40">
            Pause/play
          </button>
        </div>

        <div className="rounded-md border border-app-border bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-app-panel/40 text-center text-app-muted md:h-full md:min-h-96">
            Processed output preview
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <p className="max-w-2xl text-3xl leading-snug text-app-muted">
          Process/go to (Will show download in green slider then go to csv page.)
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/videos"
            className="rounded-md border border-app-border bg-white px-5 py-2 font-medium shadow-soft transition hover:bg-app-panel"
          >
            Back to Videos
          </Link>
          <div className="rounded-md border border-app-border bg-app-green/20 px-5 py-2 font-medium text-app-green">
            Ready to process: {filename}
          </div>
        </div>
      </div>

      <footer className="pt-2 text-center text-4xl font-medium text-app-muted">Footer</footer>
    </section>
  );
}
