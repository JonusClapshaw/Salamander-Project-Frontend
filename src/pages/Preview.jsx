import { useState, useEffect, useRef } from 'react';
import { getThumbnail } from '../mockApi.js';
import { Link, useParams } from 'react-router-dom';

export default function Preview() {
  const { filename } = useParams();
  const [previewThumb, setPreviewThumb] = useState('');
  const [currentColor, setCurrentColor] = useState("#000000")
  const [strength, setStrength] = useState(15);
  const canvasRef = useRef(null);
  const imgRef = useRef(null);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
      const file = filename;
      if (!file) {
        setPreviewThumb('');
        return;
      }
  
      getThumbnail(file)
        .then((thumbnailUrl) => setPreviewThumb(thumbnailUrl))
        .catch(() => setPreviewThumb(''));
    }, [filename]);

    useEffect(() => {
      if (!previewThumb) return;
      setImageReady(false);
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        imgRef.current = img;
        setImageReady(true);
      };
      img.src = previewThumb;
    }, [previewThumb]);

    useEffect(() => {
      if (!imageReady) return;
      const img = imgRef.current;
      const canvas = canvasRef.current;
      if (!img || !canvas) return;

      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const px = data.data;

      for (let i = 0; i < px.length; i += 4) {
        // px[i]     = red channel of this pixel (0-255)
        // px[i + 1] = green channel
        // px[i + 2] = blue channel
        // px[i + 3] = alpha (transparency, usually leave alone)
        //
        // Your algorithm from 334 goes here. Look at the pixel above,
        // look at `color` and `tolerance`, decide the pixel's new value,
        // and write it back the same way:
        //   px[i]     = newRed;
        //   px[i + 1] = newGreen;
        //   px[i + 2] = newBlue;

        // Parse the hex color string into RGB components
        const r = parseInt(currentColor.slice(1, 3), 16);
        const g = parseInt(currentColor.slice(3, 5), 16);
        const b = parseInt(currentColor.slice(5, 7), 16);

        // Euclidean distance between this pixel's color and the target color
        // (mirrors DistanceImageBinarizer + ColorDistanceFinder)
        const dr = px[i]     - r;
        const dg = px[i + 1] - g;
        const db = px[i + 2] - b;
        const dist = Math.sqrt(dr * dr + dg * dg + db * db);

        // `strength` is 0–100; scale it to the max possible Euclidean distance (~441)
        // to match Java's integer threshold concept
        const threshold = (strength / 100) * 441;

        // White (1) if dist < threshold, black (0) otherwise
        // mirrors: distanceFinder.distance(color, targetColor) < threshold → 1
        if (dist < threshold) {
          px[i] = px[i + 1] = px[i + 2] = 255; // white
        } else {
          px[i] = px[i + 1] = px[i + 2] = 0;   // black
        }
      }

      ctx.putImageData(data, 0, 0);
    }, [imageReady, currentColor, strength]);

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
        <div className="rounded-md border border-app-border bg-white shadow-soft flex items-center justify-center h-72 p-5">
          {previewThumb === "" ? (
            <div className="flex h-full w-full items-center justify-center bg-app-panel/40 text-center text-app-muted">
              Loading...
            </div>
          ) : (
            <img
              src={previewThumb}
              alt={`Preview thumbnail for ${filename}`}
              className="max-h-full max-w-full rounded-md border border-app-panel object-contain"
            />
          )}
        </div>

        <div className="rounded-md border border-app-border bg-white shadow-soft flex items-center justify-center h-72 p-5">
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
          <div className="rounded-md border border-app-border bg-app-green/20 px-5 py-2 font-medium text-app-green">
            Ready to process: {filename}
          </div>
        </div>
      </div>
    </section>
  );
}
