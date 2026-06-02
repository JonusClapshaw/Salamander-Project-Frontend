const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const fallbackThumbnails = {
  "salamander1.mp4": "/salamander1.jpeg",
  "salamander2.mov": "https://placehold.co/320x180?text=salamander2",
  "forest_intro.mp4": "https://placehold.co/320x180?text=forest_intro",
  "tank_view_long.mp4": "https://placehold.co/320x180?text=tank_view_long",
};

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

export async function getVideos() {
  const data = await fetchJson('/api/videos');
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.videos)) {
    return data.videos;
  }

  throw new Error('Unexpected /api/videos response format.');
}

export async function getThumbnail(filename) {
  const encoded = encodeURIComponent(filename);

  const candidates = [
    apiUrl(`/thumbnail/${encoded}`),
    apiUrl(`/api/thumbnail/${encoded}`),
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok) {
        return url;
      }
    } catch {
      // Try next candidate endpoint.
    }
  }

  if (fallbackThumbnails[filename]) {
    return fallbackThumbnails[filename];
  }

  throw new Error(`No thumbnail for ${filename}`);
}

export async function submitProcessingJob(filename, targetColor, threshold) {
  return fetchJson('/api/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filename, targetColor, threshold }),
  });
}

export async function getJobStatus(jobId) {
  return fetchJson(`/api/results?jobId=${encodeURIComponent(jobId)}`);
}