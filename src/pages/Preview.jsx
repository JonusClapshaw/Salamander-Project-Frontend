import { useState, useEffect, useMemo, useRef } from 'react';
import { getVideoCandidates, submitProcessingJob, getJobStatus } from '../api.js';
import { Link, useParams } from 'react-router-dom';

export default function Preview() {
  const { filename: encodedFilename } = useParams();
  const filename = encodedFilename ? decodeURIComponent(encodedFilename) : '';
  const [videoCandidateIndexByFile, setVideoCandidateIndexByFile] = useState({});
  const [currentColor, setCurrentColor] = useState("#000000")
  const [strength, setStrength] = useState(15);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [processStatus, setProcessStatus] = useState('idle');
  const [processError, setProcessError] = useState('');
  const [jobId, setJobId] = useState('');
  const [jobResult, setJobResult] = useState(null);

  const videoCandidates = useMemo(() => {
    return filename ? getVideoCandidates(filename) : [];
  }, [filename]);
  const videoCandidateIndex = filename ? (videoCandidateIndexByFile[filename] ?? 0) : 0;
  const previewVideoUrl = videoCandidates[videoCandidateIndex] ?? '';

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
        }

        rafId = requestAnimationFrame(drawFrame);
      };

      rafId = requestAnimationFrame(drawFrame);

      return () => {
        if (rafId !== null) {
          cancelAnimationFrame(rafId);
        }
      };
    }, [previewVideoUrl, currentColor, strength]);

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
      setProcessStatus('submitting');
      setJobResult(null);

      try {
        const submission = await submitProcessingJob(filename, currentColor, strength);
        const newJobId = submission?.jobId;

        if (!newJobId) {
          throw new Error('Server did not return a jobId.');
        }

        setJobId(newJobId);

        if (submission?.status === 'completed' || submission?.status === 'complete') {
          setJobResult(submission?.data ?? submission);
          setProcessStatus('completed');
          return;
        }

        setProcessStatus('polling');

        for (let attempt = 0; attempt < 10; attempt += 1) {
          const polled = await getJobStatus(newJobId);
          const status = polled?.status ?? polled?.data?.status ?? 'completed';

          if (status === 'completed' || status === 'complete') {
            setJobResult(polled?.data ?? polled);
            setProcessStatus('completed');
            return;
          }

          if (status === 'failed' || status === 'error') {
            throw new Error(polled?.error ?? 'Processing failed on server.');
          }

          await new Promise((resolve) => setTimeout(resolve, 700));
        }

        throw new Error('Timed out waiting for server results.');
      } catch (err) {
        setProcessStatus('error');
        setProcessError(err instanceof Error ? err.message : 'Could not process video.');
      }
    }

  return (
    <section className="space-y-5">
      <div className="rounded-md border border-app-border bg-white/85 px-5 py-10 shadow-soft">
        <div className="text-center">
          <h1 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">{filename}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2">
            <div className="grid grid-cols-3 max-w-lg rounded-md border border-app-border bg-white px-4 py-2 mx-2 shadow-soft">
              <p className="text-center pt-2">Choose your color:</p>
                <input 
                    className="col-span-2 w-auto border border-app-border bg-white shadow-soft mt-2"
                    type="color" 
                    value={currentColor}
                    onChange={(e) => setCurrentColor(e.target.value)}>
                </input>
            </div>
        <div className="max-w-lg rounded-md border border-app-border bg-white px-4 py-2 mx-4 shadow-soft">
            <label htmlFor="threshold" className="mb-1 block text-sm font-medium text-app-muted">
            Strength: <span>{strength}</span>
            </label>
            <input
            id="threshold"
            type="range"
            min="0"
            max="100"
            defaultValue="15"
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-app-blue"
            />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
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
              className="max-h-full max-w-full rounded-md border border-app-panel bg-black object-contain"
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

      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <Link
            to="/videos"
            className="rounded-md border border-app-border bg-white px-5 py-2 font-medium shadow-soft transition hover:bg-app-panel"
          >
            Back to Videos
          </Link>
          <button
            type="button"
            onClick={handleProcess}
            disabled={processStatus === 'submitting' || processStatus === 'polling'}
            className="rounded-md border border-app-green bg-app-green/20 px-5 py-2 font-medium text-app-green transition hover:bg-app-green/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {processStatus === 'submitting' || processStatus === 'polling'
              ? 'Processing...'
              : `Process ${filename}`}
          </button>
        </div>
      </div>

      {jobId ? (
        <div className="rounded-md border border-app-border bg-white px-5 py-4 shadow-soft">
          <p className="text-sm text-app-muted">Job ID: {jobId}</p>
          <p className="text-base font-medium text-app-ink">Status: {processStatus}</p>
          {processError ? <p className="mt-2 text-sm text-red-700">{processError}</p> : null}
          {jobResult ? (
            <pre className="mt-3 max-h-52 overflow-auto rounded bg-app-panel/30 p-3 text-xs text-app-ink">
              {JSON.stringify(jobResult, null, 2)}
            </pre>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
