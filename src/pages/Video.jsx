import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getThumbnail, getVideos } from '../mockApi.js';

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [hoveredVideo, setHoveredVideo] = useState('');
  const [previewThumb, setPreviewThumb] = useState('');

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  useEffect(() => {
    getVideos().then((data) => {
        setLoading(false);
        setVideos(data);
        setSelectedVideo(data[0] ?? '');
        setHoveredVideo(data[0] ?? '');
    }).catch((err) => {
        setError(err.message);
        setLoading(false);
    });
  }, []);

  useEffect(() => {
    const fileToPreview = hoveredVideo || selectedVideo;
    if (!fileToPreview) {
      setPreviewThumb('');
      return;
    }

    getThumbnail(fileToPreview)
      .then((thumbnailUrl) => setPreviewThumb(thumbnailUrl))
      .catch(() => setPreviewThumb(''));
  }, [hoveredVideo, selectedVideo]);

  if(loading) {
    return <p className="text-lg">Loading videos...</p>;
  }

  if(error) {
    return <p className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-700">Could not load videos: {error}</p>;
  }

  return (
    <section className="space-y-6">

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-md border border-app-border bg-white px-6 py-6 text-center text-2xl font-medium shadow-soft">
            Recordings:
          </div>

          <div className="min-h-80 rounded-md border border-app-border bg-white p-6 shadow-soft">
            <ul className="space-y-3 text-lg">
              {videos.map((filename) => (
                <li
                  key={filename}
                  className="flex flex-wrap items-center gap-2"
                  onMouseEnter={() => setHoveredVideo(filename)}
                  onMouseLeave={() => setHoveredVideo('')}
                >
                  <button
                    type="button"
                    className={`text-left transition ${selectedVideo === filename ? 'font-semibold text-app-blue' : 'text-app-ink hover:text-app-blue'}`}
                    onClick={() => setSelectedVideo(filename)}
                  >
                    {filename}
                  </button>
                  <Link
                    to={`/preview/${filename}`}
                    className="font-medium text-app-amber underline-offset-4 transition hover:underline"
                  >
                    [Preview]
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-md border border-app-border bg-white p-6 shadow-soft">
          {previewThumb ? (
            <img
              src={previewThumb}
              alt={`Preview thumbnail for ${hoveredVideo || selectedVideo}`}
              className="mb-5 h-56 w-full rounded-md border border-app-panel object-cover md:h-72"
            />
          ) : (
            <div className="mb-5 flex h-56 w-full items-center justify-center rounded-md border border-dashed border-app-panel bg-app-panel/30 text-center text-app-muted md:h-72">
              Thumbnail if hovering over a video link
            </div>
          )}
          <p className="text-center text-xl text-app-muted">
            Playback video after clicking &#39;Preview&#39; on a video
          </p>
        </div>
      </div>

      <div className="text-center">
        <Link
          to={selectedVideo ? `/preview/${selectedVideo}` : '/videos'}
          className="inline-block rounded-md border border-app-border bg-white px-12 py-3 text-2xl font-medium shadow-soft transition hover:-translate-y-0.5 hover:bg-app-panel"
        >
          Continue
        </Link>
      </div>
    </section>
  );
}