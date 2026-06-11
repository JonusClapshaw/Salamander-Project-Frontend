const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '';

const thumbnailCache = new Map();

function apiUrl(path) {
  return `${API_BASE}${path}`;
}

async function fetchJson(path, options = {}) {
  const response = await fetch(apiUrl(path), options);
  if (!response.ok) {
    throw new Error(`Server responded ${response.status}`);
  }
  return response.json();
}

export async function getVideos() {
  const data = await fetchJson('/api/videos');
  return Array.isArray(data?.videos) ? data.videos : data;
}

export async function getThumbnail(filename) {
  if (thumbnailCache.has(filename)) {
    const cachedUrl = thumbnailCache.get(filename);
    if (cachedUrl) {
      return cachedUrl;
    }
    throw new Error(`No thumbnail for ${filename}`);
  }

  const encoded = encodeURIComponent(filename);
  const candidates = [
    apiUrl(`/thumbnail/${encoded}`),
    apiUrl(`/api/thumbnail/${encoded}`),
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        thumbnailCache.set(filename, url);
        return url;
      }
    } catch {
      // Try the next endpoint variant.
    }
  }

  thumbnailCache.set(filename, null);
  throw new Error(`No thumbnail for ${filename}`);
}

export function getVideoCandidates(filename) {
  const encoded = encodeURIComponent(filename);
  return [
    apiUrl(`/video/${encoded}`),
    apiUrl(`/api/video/${encoded}`),
    apiUrl(`/videos/${encoded}`),
    apiUrl(`/api/videos/${encoded}`),
  ];
}

export async function submitProcessingJob(filename, targetColor, threshold) {
  const hexColor = targetColor.replace('#', '');
  return fetchJson('/api/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      filename,
      targetColor: hexColor,
      threshold,
    }),
  });
}

export async function getJobStatus(jobId) {
  const encodedJobId = encodeURIComponent(jobId);
  return fetchJson(`/api/results?jobId=${encodedJobId}`);
}

function getFilenameFromContentDisposition(headerValue) {
  if (!headerValue) {
    return '';
  }

  const utf8Match = headerValue.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }

  const asciiMatch = headerValue.match(/filename="?([^";]+)"?/i);
  return asciiMatch?.[1] ?? '';
}

export async function downloadJobCsv(jobId) {
  const encodedJobId = encodeURIComponent(jobId);
  const response = await fetch(apiUrl(`/api/download/${encodedJobId}`));

  if (!response.ok) {
    throw new Error(`Download failed (${response.status}).`);
  }

  const csvBlob = await response.blob();
  const contentDisposition = response.headers.get('Content-Disposition');
  const filenameFromHeader = getFilenameFromContentDisposition(contentDisposition);
  const downloadName = filenameFromHeader || `${jobId}.csv`;

  const url = URL.createObjectURL(csvBlob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = downloadName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}