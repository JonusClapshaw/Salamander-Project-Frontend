export async function getVideos() {
  const res = await fetch('/api/videos');
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}

export async function getThumbnail(filename) {
  const url = `/thumbnail/${filename}`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`No thumbnail for ${filename}`);
  }
  return url;
}

export async function submitProcessingJob(filename, targetColor, threshold) {
  // The contract wants the hex with no leading '#'.
  const hex = targetColor.replace('#', '');
  const res = await fetch(
    `/process/${filename}?targetColor=${hex}&threshold=${threshold}`,
    { method: 'POST' }
  );
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}

export async function getJobStatus(jobId) {
  const res = await fetch(`/process/${jobId}/status`);
  if (!res.ok) {
    throw new Error(`Server responded ${res.status}`);
  }
  return res.json();
}