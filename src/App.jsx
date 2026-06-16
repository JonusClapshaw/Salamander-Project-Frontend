import { Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home.jsx'
import Videos from './pages/Video.jsx';
import Preview from './pages/Preview.jsx';

export default function App() {
  return (
    <div className="min-h-screen bg-app-base text-app-ink">
      <header className="border-b border-app-panel bg-white/75 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 md:px-8">
          <Link to="/" className="text-lg font-semibold tracking-wide">
            Salamander Tracker
          </Link>
          <nav className="flex gap-2 text-sm font-medium md:text-base">
            <Link
              to="/"
              className="rounded-md border border-app-panel px-3 py-1.5 transition hover:bg-app-panel/40"
            >
              Home
            </Link>
            <Link
              to="/videos"
              className="rounded-md border border-app-panel px-3 py-1.5 transition hover:bg-app-panel/40"
            >
              Videos
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-5 py-8 md:px-8 md:py-10">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/videos" element={<Videos />} />
          <Route path="/preview/:filename" element={<Preview />} />
        </Routes>
      </main>
    </div>
  );
}
