import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getThumbnail, getVideoCandidates, getVideos } from '../api.js';

function normalizeVideoItem(item, index) {
  if (typeof item === 'string') {
    return {
      id: item,
      filename: item,
      label: item,
      durationSeconds: null,
    };
  }

  if (item && typeof item === 'object') {
    const filename = item.filename ?? item.name ?? '';
    const id = item.id ?? filename ?? `video-${index}`;

    return {
      id,
      filename,
      label: item.name ?? filename ?? `Video ${index + 1}`,
      durationSeconds: item.durationSeconds ?? null,
    };
  }

  const fallback = String(item ?? `video-${index}`);
  return {
    id: fallback,
    filename: fallback,
    label: fallback,
    durationSeconds: null,
  };
}

function formatDuration(durationSeconds) {
  if (!Number.isFinite(durationSeconds) || durationSeconds < 0) {
    return '';
  }

  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

export default function Videos() {
  const [videos, setVideos] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState('');
  const [hoveredVideo, setHoveredVideo] = useState('');
  const [thumbnailByFile, setThumbnailByFile] = useState({});
  const [videoCandidateIndexByFile, setVideoCandidateIndexByFile] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getVideos()
      .then((data) => {
        const normalizedVideos = Array.isArray(data)
          ? data.map((item, index) => normalizeVideoItem(item, index)).filter((video) => video.filename)
          : [];

        setVideos(normalizedVideos);
        setSelectedVideo(normalizedVideos[0]?.filename ?? '');
        setHoveredVideo(normalizedVideos[0]?.filename ?? '');
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const fileToPreview = hoveredVideo || selectedVideo;
  const videoCandidates = useMemo(() => {
    return fileToPreview ? getVideoCandidates(fileToPreview) : [];
  }, [fileToPreview]);
  const videoCandidateIndex = fileToPreview ? (videoCandidateIndexByFile[fileToPreview] ?? 0) : 0;
  const activeVideoUrl = videoCandidates[videoCandidateIndex] ?? '';
  const previewThumb = fileToPreview ? (thumbnailByFile[fileToPreview] ?? '') : '';

  useEffect(() => {
    if (!fileToPreview) {
      return;
    }

    if (thumbnailByFile[fileToPreview] !== undefined) {
      return;
    }

    let cancelled = false;

    getThumbnail(fileToPreview)
      .then((thumbnailUrl) => {
        if (!cancelled) {
          setThumbnailByFile((previous) => ({
            ...previous,
            [fileToPreview]: thumbnailUrl,
          }));
        }
      })
      .catch(() => {
        if (!cancelled) {
          setThumbnailByFile((previous) => ({
            ...previous,
            [fileToPreview]: '',
          }));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [fileToPreview, thumbnailByFile]);

  function handleVideoError() {
    if (!fileToPreview) {
      return;
    }

    setVideoCandidateIndexByFile((previous) => {
      const currentIndex = previous[fileToPreview] ?? 0;
      const nextIndex = currentIndex + 1;

      return {
        ...previous,
        [fileToPreview]: nextIndex < videoCandidates.length ? nextIndex : currentIndex,
      };
    });
  }

  if (loading) {
    return <p className="text-lg">Loading videos...</p>;
  }

  if (error) {
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
              {videos.map((video, index) => (
                <li
                  key={`${video.id}-${video.filename}-${index}`}
                  className="flex flex-wrap items-center gap-2"
                  onMouseEnter={() => setHoveredVideo(video.filename)}
                  onMouseLeave={() => setHoveredVideo('')}
                >
                  <button
                    type="button"
                    className={`text-left transition ${selectedVideo === video.filename ? 'font-semibold text-app-blue' : 'text-app-ink hover:text-app-blue'}`}
                    onClick={() => setSelectedVideo(video.filename)}
                  >
                    {video.label}
                    {video.durationSeconds !== null ? ` (${formatDuration(video.durationSeconds)})` : ''}
                  </button>
                  <Link
                    to={`/preview/${encodeURIComponent(video.filename)}`}
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
          {activeVideoUrl ? (
            <video
              key={`${fileToPreview}-${activeVideoUrl}`}
              src={activeVideoUrl}
              controls
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              onError={handleVideoError}
              className="mb-5 h-56 w-full rounded-md border border-app-panel bg-black object-cover md:h-72"
            >
              Sorry, your browser cannot play this video.
            </video>
          ) : previewThumb ? (
            <img
              src={previewThumb}
              alt={`Preview thumbnail for ${fileToPreview}`}
              className="mb-5 h-56 w-full rounded-md border border-app-panel object-cover md:h-72"
            />
          ) : (
            <div className="mb-5 flex h-56 w-full items-center justify-center rounded-md border border-dashed border-app-panel bg-app-panel/30 text-center text-app-muted md:h-72">
              No preview available.
            </div>
          )}
          <p className="text-center text-xl text-app-muted">
            Playback video after clicking &#39;Preview&#39; on a video
          </p>
        </div>
      </div>
    </section>
  );
}
