# Salamander Project Frontend

Anthony and Jonus

React + Vite frontend for browsing videos, sampling color, running processing, and downloading CSV results.

## Requirements

- Node.js 18+ (Node.js 20 LTS recommended)
- npm

## Run Locally

1. Install dependencies

	npm install

2. Start the frontend

	npm run dev

3. Open the URL shown in terminal (usually http://localhost:5173)

## Connect To Any Backend

This frontend reads backend base URL from Vite env variable:

- VITE_API_BASE_URL

Create a file named .env.local in the project root and add:

VITE_API_BASE_URL=http://localhost:8080

Then restart the frontend:

npm run dev

You can point this to someone else's backend URL as long as it exposes the required routes and allows CORS from your frontend origin.

## Required Backend Endpoints

The frontend expects these endpoints:

- GET /api/videos
- GET /thumbnail/:filename (or /api/thumbnail/:filename)
- GET /video/:filename (or /api/video/:filename, /videos/:filename, /api/videos/:filename)
- POST /api/process
- GET /api/results?jobId=...
- GET /api/download/:jobId

## Process Request Body

When starting processing, frontend sends:

{
  "filename": "example.mp4",
  "targetColor": "FF00AA",
  "threshold": 15
}

Notes:
- targetColor is hex without the # character
- threshold is 0-100

## Build And Preview

- Build:

  npm run build

- Preview built app locally:

  npm run preview

## Deploy To GitHub Pages

1. Install dependencies

	npm install

2. Deploy

	npm run deploy

This publishes the dist folder to the gh-pages branch.

## Troubleshooting

- If video list is empty: check /api/videos response and browser network tab.
- If downloads fail: verify /api/download/:jobId returns a file and correct HTTP status.
- If backend is on another host: enable CORS for your frontend origin (for example http://localhost:5173).

## New Feature 

- Download status
  - Once you click to process the download it shows the percent comepletion
  - After download is complete you can see the downloads output on the webpage itself before you download it  

## Screen shots
