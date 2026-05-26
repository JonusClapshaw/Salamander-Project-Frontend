import { useState } from 'react';
import { getThumbnail } from '../mockApi.js';
import { Link, useParams } from 'react-router-dom';

export default function Preview() {
  const { filename } = useParams();
  const [currentColor, setCurrentColor] = useState("#000000")
  const [strength, setStrength] = useState(40);

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
            defaultValue="40"
            onChange={(e) => setStrength(Number(e.target.value))}
            className="w-full accent-app-blue"
            />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-md border border-app-border bg-white shadow-soft">
          {/* <div className="flex h-72 items-center justify-center bg-app-panel/40 text-center text-app-muted md:h-96">
            Thumbnail / frame preview
          </div> */}
          <img
              src={filename}
              alt={`Preview thumbnail for ${filename}`}
              className="mb-5 h-56 w-full rounded-md border border-app-panel object-cover md:h-72"
            />
        </div>

        <div className="rounded-md border border-app-border bg-white shadow-soft">
          <div className="flex h-72 items-center justify-center bg-app-panel/40 text-center text-app-muted md:h-full md:min-h-96">
            Processed output preview
          </div>
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
