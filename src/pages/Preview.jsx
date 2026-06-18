import { useState, useEffect, useMemo, useRef } from 'react';
import { getVideoCandidates, submitProcessingJob, getJobStatus, downloadJobCsv } from '../api.js';
import { Link, useParams } from 'react-router-dom';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getJobSnapshot(payload) {
  const data = payload?.data ?? payload;
  const rawStatus = payload?.status ?? data?.status;
  const normalizedStatus = typeof rawStatus === 'string' ? rawStatus.toLowerCase() : '';
  const rawProgress = payload?.progressPercent ?? data?.progressPercent;
  const numericProgress = Number(rawProgress);

  const progressPercent = Number.isFinite(numericProgress)
    ? Math.max(0, Math.min(100, numericProgress))
    : null;

  return {
    status: normalizedStatus,
    progressPercent,
    data,
    error: payload?.error ?? data?.error,
  };
}

function normalizeHexColor(value) {
  const sanitized = String(value ?? '').trim().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}$/.test(sanitized)) {
    return `#${sanitized.toUpperCase()}`;
  }
  return null;
}

export default function Preview() {
  const { filename: encodedFilename } = useParams();
  const filename = encodedFilename ? decodeURIComponent(encodedFilename) : '';
  const [videoCandidateIndexByFile, setVideoCandidateIndexByFile] = useState({});
  const [currentColor, setCurrentColor] = useState("#000000")
  const [strength, setStrength] = useState(15);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [processStatus, setProcessStatus] = useState('idle');
  const [progressPercent, setProgressPercent] = useState(0);
  const [processError, setProcessError] = useState('');
  const [downloadError, setDownloadError] = useState('');
  const [downloadStatus, setDownloadStatus] = useState('idle');
  const [jobId, setJobId] = useState('');
  const [jobResult, setJobResult] = useState(null);
  const [hexInput, setHexInput] = useState('#000000');
  const [isSamplingColor, setIsSamplingColor] = useState(false);
  const [showCentroid, setShowCentroid] = useState(true);

  const videoCandidates = useMemo(() => {
    return filename ? getVideoCandidates(filename) : [];
  }, [filename]);
  const videoCandidateIndex = filename ? (videoCandidateIndexByFile[filename] ?? 0) : 0;
  const previewVideoUrl = videoCandidates[videoCandidateIndex] ?? '';

    useEffect(() => {
      setHexInput(currentColor);
    }, [currentColor]);

    function handleHexInputChange(event) {
      const nextValue = event.target.value;
      setHexInput(nextValue);

      const normalized = normalizeHexColor(nextValue);
      if (normalized) {
        setCurrentColor(normalized);
      }
    }

    function handleNativeColorChange(event) {
      const nextColor = event.target.value;
      setCurrentColor(nextColor);
      setHexInput(nextColor.toUpperCase());
    }

    function handleVideoColorSample(event) {
      const video = videoRef.current;
      if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      const rect = video.getBoundingClientRect();
      const scaleX = video.videoWidth / rect.width;
      const scaleY = video.videoHeight / rect.height;
      const sampleX = Math.max(0, Math.min(video.videoWidth - 1, Math.round((event.clientX - rect.left) * scaleX)));
      const sampleY = Math.max(0, Math.min(video.videoHeight - 1, Math.round((event.clientY - rect.top) * scaleY)));

      const offscreenCanvas = document.createElement('canvas');
      offscreenCanvas.width = video.videoWidth;
      offscreenCanvas.height = video.videoHeight;
      const context = offscreenCanvas.getContext('2d', { willReadFrequently: true });
      if (!context) {
        return;
      }

      context.drawImage(video, 0, 0, offscreenCanvas.width, offscreenCanvas.height);
      const [r, g, b] = context.getImageData(sampleX, sampleY, 1, 1).data;
      const sampledColor = `#${[r, g, b]
        .map((channel) => channel.toString(16).padStart(2, '0'))
        .join('')
        .toUpperCase()}`;

      setCurrentColor(sampledColor);
      setHexInput(sampledColor);
      setIsSamplingColor(false);
    }

    useEffect(() => {
      if (!previewVideoUrl) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas) return;

      let rafId = null;

      const drawFrame = () => {
        if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
          }

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            rafId = requestAnimationFrame(drawFrame);
            return;
          }

          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const px = data.data;

          const r = parseInt(currentColor.slice(1, 3), 16);
          const g = parseInt(currentColor.slice(3, 5), 16);
          const b = parseInt(currentColor.slice(5, 7), 16);
          const threshold = (strength / 100) * 441;

          for (let i = 0; i < px.length; i += 4) {
            const dr = px[i] - r;
            const dg = px[i + 1] - g;
            const db = px[i + 2] - b;
            const dist = Math.sqrt(dr * dr + dg * dg + db * db);

            if (dist < threshold) {
              px[i] = px[i + 1] = px[i + 2] = 255;
            } else {
              px[i] = px[i + 1] = px[i + 2] = 0;
            }
          }

          ctx.putImageData(data, 0, 0);

          // Build a binary 2D array from the processed pixel data
          const width = canvas.width;
          const height = canvas.height;
          const binary = [];
          for (let row = 0; row < height; row++) {
            binary[row] = [];
            for (let col = 0; col < width; col++) {
              const i = (row * width + col) * 4;
              binary[row][col] = px[i] === 255 ? 1 : 0;
            }
          }

          // DFS to find connected groups and their centroids
          const visited = Array.from({ length: height }, () => new Array(width).fill(false));
          const moves = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          let largestGroup = null;

          function collectPixels(row, col) {
            const stack = [[row, col]];
            let sumX = 0, sumY = 0, size = 0;
            while (stack.length > 0) {
              const [r, c] = stack.pop();
              if (r < 0 || r >= height || c < 0 || c >= width || visited[r][c] || binary[r][c] === 0) continue;
              visited[r][c] = true;
              sumX += c;
              sumY += r;
              size++;
              for (const [dr, dc] of moves) {
                stack.push([r + dr, c + dc]);
              }
            }
            return { size, cx: Math.floor(sumX / size), cy: Math.floor(sumY / size) };
          }

          for (let row = 0; row < height; row++) {
            for (let col = 0; col < width; col++) {
              if (binary[row][col] === 1 && !visited[row][col]) {
                const group = collectPixels(row, col);
                if (!largestGroup || group.size > largestGroup.size) {
                  largestGroup = group;
                }
              }
            }
          }

          // Draw the centroid indicator
          if (largestGroup && showCentroid) {
            const { cx, cy } = largestGroup;
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.beginPath();
            ctx.arc(cx, cy, 6, 0, 2 * Math.PI);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
        }

        rafId = requestAnimationFrame(drawFrame);
      };

      rafId = requestAnimationFrame(drawFrame);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }, [previewVideoUrl, currentColor, strength, showCentroid]);

    function handleVideoError() {
      if (!filename) {
        return;
      }

      setVideoCandidateIndexByFile((previous) => {
        const currentIndex = previous[filename] ?? 0;
        const nextIndex = currentIndex + 1;
        return {
          ...previous,
          [filename]: nextIndex < videoCandidates.length ? nextIndex : currentIndex,
        };
      });
    }

    async function handleProcess() {
      if (!filename) {
        return;
      }

      setProcessError('');
      setDownloadError('');
      setDownloadStatus('idle');
      setProcessStatus('submitting');
      setProgressPercent(0);
      setJobResult(null);

      try {
        const scaledThreshold = Math.round((strength / 100) * 441);
        const submission = await submitProcessingJob(filename, currentColor, scaledThreshold);
        const newJobId = submission?.jobId;
        const submissionSnapshot = getJobSnapshot(submission);

        if (!newJobId) {
          throw new Error('Server did not return a jobId.');
        }

        setJobId(newJobId);
        if (submissionSnapshot.progressPercent !== null) {
          setProgressPercent(submissionSnapshot.progressPercent);
        }

        if (submissionSnapshot.status === 'completed' || submissionSnapshot.status === 'complete') {
          setProgressPercent(100);
          setJobResult(submissionSnapshot.data ?? submission);
          setProcessStatus('completed');
          return;
        }

        if (submissionSnapshot.status === 'failed' || submissionSnapshot.status === 'error') {
          setProcessStatus('failed');
          setProcessError(submissionSnapshot.error ?? 'Processing failed on server.');
          return;
        }

        setProcessStatus('polling');

        for (let attempt = 0; attempt < 300; attempt += 1) {
          await sleep(700);
          const polled = await getJobStatus(newJobId);
          const snapshot = getJobSnapshot(polled);

          if (snapshot.progressPercent !== null) {
            setProgressPercent(snapshot.progressPercent);
          }

          if (snapshot.status === 'completed' || snapshot.status === 'complete') {
            setProgressPercent(100);
            setJobResult(snapshot.data ?? polled);
            setProcessStatus('completed');
            return;
          }

          if (snapshot.status === 'failed' || snapshot.status === 'error') {
            setProcessStatus('failed');
            setProcessError(snapshot.error ?? 'Processing failed on server.');
            return;
          }
        }

        throw new Error('Timed out waiting for server results.');
      } catch (err) {
        setProcessStatus((current) => (current === 'failed' ? current : 'error'));
        setProcessError(err instanceof Error ? err.message : 'Could not process video.');
      }
    }

    async function handleDownloadCsv() {
      if (!jobId) {
        return;
      }

      setDownloadError('');
      setDownloadStatus('downloading');

      try {
        await downloadJobCsv(jobId);
        setDownloadStatus('success');
      } catch (err) {
        setDownloadStatus('error');
        setDownloadError(err instanceof Error ? err.message : 'Could not download CSV.');
      }
    }

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-app-border bg-white/90 px-5 py-10 shadow-soft">
        <div className="text-center">
          <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">{filename}</h1>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-app-border bg-white shadow-soft h-full flex flex-col">
          <div className="px-4 py-3 space-y-4">
            <div>
              <p className="mb-2 text-sm font-medium text-app-muted">Choose your color:</p>
              <div className="grid grid-cols-[40px,1fr] items-center gap-3">
                <span
                  aria-hidden="true"
                  className="h-8 w-8 rounded border border-app-border"
                  style={{ backgroundColor: currentColor }}
                />
                <input
                  type="text"
                  inputMode="text"
                  value={hexInput}
                  onChange={handleHexInputChange}
                  aria-label="Hex color"
                  className="w-full rounded-md border border-app-border px-2 py-1 text-sm text-app-ink shadow-soft focus:outline-none focus:ring-2 focus:ring-app-blue/40"
                  placeholder="#RRGGBB"
                />
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsSamplingColor((current) => !current)}
                  className="rounded-md border border-app-blue bg-app-blue/10 px-3 py-1 text-xs font-medium text-app-blue transition hover:bg-app-blue/20"
                >
                  {isSamplingColor ? 'Click video to sample...' : 'Sample From Video'}
                </button>
              </div>
            </div>

            <div className="border-t border-app-border pt-3">
              <label htmlFor="threshold" className="mb-1 block text-sm font-medium text-app-muted">
                Strength: <span>{strength}</span>
              </label>
              <input
                id="threshold"
                type="range"
                min="0"
                max="100"
                value={strength}
                onChange={(e) => setStrength(Number(e.target.value))}
                className="w-full accent-app-blue"
              />

              <div className="mt-3 flex items-center gap-2">
                <input
                  id="showCentroid"
                  type="checkbox"
                  checked={showCentroid}
                  onChange={(e) => setShowCentroid(e.target.checked)}
                  className="accent-app-blue"
                />
                <label htmlFor="showCentroid" className="text-sm font-medium text-app-muted">
                  Show centroid
                </label>
              </div>
            </div>

            {jobId ? (
              <div className="border-t border-app-border pt-3">
                <p className="text-sm text-app-muted">Job ID: {jobId}</p>
                <p className="text-base font-medium text-app-ink">Status: {processStatus}</p>
                <p className="mt-1 text-sm text-app-muted">Progress: {Math.round(progressPercent)}%</p>
                <div
                  className="mt-2 h-2 w-full overflow-hidden rounded-full bg-app-panel/60"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={Math.round(progressPercent)}
                  aria-label="Processing progress"
                >
                  <div
                    className="h-full bg-app-blue transition-all duration-300"
                    style={{ width: `${Math.round(progressPercent)}%` }}
                  />
                </div>
                {processError ? <p className="mt-2 text-sm text-red-700">{processError}</p> : null}
                {downloadError ? <p className="mt-2 text-sm text-red-700">{downloadError}</p> : null}
                {jobResult ? (
                  <pre className="mt-3 max-h-52 overflow-auto rounded bg-app-panel/30 p-3 text-xs text-app-ink">
                    {JSON.stringify(jobResult, null, 2)}
                  </pre>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-auto border-t border-app-border px-4 py-3">
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/videos"
                className="rounded-md border border-app-border bg-white px-4 py-2 text-sm font-medium shadow-soft transition hover:border-app-blue/30 hover:bg-app-blue/10"
              >
                Back to Videos
              </Link>
              <button
                type="button"
                onClick={handleProcess}
                disabled={processStatus === 'submitting' || processStatus === 'polling'}
                className="rounded-md border border-app-green bg-app-green/20 px-4 py-2 text-sm font-medium text-app-green transition hover:bg-app-green/30 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {processStatus === 'submitting' || processStatus === 'polling'
                  ? 'Processing...'
                  : `Process ${filename}`}
              </button>
              <button
                type="button"
                onClick={handleDownloadCsv}
                disabled={!jobId || processStatus !== 'completed' || downloadStatus === 'downloading'}
                className="rounded-md border border-app-blue bg-app-blue/15 px-4 py-2 text-sm font-medium text-app-blue transition hover:bg-app-blue/25 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {downloadStatus === 'downloading' ? 'Downloading CSV...' : 'Download CSV'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-md border border-app-border bg-white shadow-soft flex items-center justify-center h-72 p-3">
            {previewVideoUrl ? (
              <video
                key={`${filename}-${previewVideoUrl}`}
                ref={videoRef}
                src={previewVideoUrl}
                controls
                autoPlay
                muted
                loop
                playsInline
                preload="metadata"
                onError={handleVideoError}
                onClick={handleVideoColorSample}
                title={isSamplingColor ? 'Click to sample color from this frame' : undefined}
                className={`max-h-full max-w-full rounded-md border border-app-panel bg-black object-contain ${isSamplingColor ? 'cursor-crosshair ring-2 ring-app-blue/60' : ''}`}
              >
                Sorry, your browser cannot play this video.
              </video>
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-app-panel/40 text-center text-app-muted">
                No video preview available.
              </div>
            )}
          </div>

          <div className="rounded-md border border-app-border bg-white shadow-soft flex items-center justify-center h-72 p-3">
            <canvas
              ref={canvasRef}
              style={{ maxHeight: '100%', maxWidth: '100%' }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
