// Live demo: query a Piped instance for streams of a real YouTube video ID
// and run the same scoring/selection logic as src/lib/youtube.ts

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://pipedapi.adminforge.de',
  'https://pipedapi.in.projectsegfau.lt',
  'https://pipedapi.mha.fi',
  'https://api.piped.video',
  'https://pipedapi.leptons.xyz',
  'https://md-piped-api.herokuapp.com'
];

function scoreStream(stream) {
  const bitrate = Number(stream?.bitrate) || 0;
  const quality = typeof stream?.quality === 'string' ? parseInt(stream.quality, 10) || 0 : 0;
  const qualityLabel = typeof stream?.qualityLabel === 'string' ? parseInt(stream.qualityLabel, 10) || 0 : 0;
  const audioOnlyBonus = stream?.mimeType?.startsWith('audio/') ? 2000000 : 0;
  const videoAudioBonus = stream?.mimeType?.includes('audio') ? 500000 : 0;
  const hqPenalty = /preview|low|tiny|144p|240p/i.test(`${stream?.quality || ''} ${stream?.qualityLabel || ''}`) ? -2000000 : 0;
  return bitrate + quality + qualityLabel + audioOnlyBonus + videoAudioBonus + hqPenalty;
}

async function fetchWithTimeout(url, ms = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

async function test(videoId) {
  for (let i = 0; i < PIPED_INSTANCES.length; i++) {
    const api = PIPED_INSTANCES[i];
    try {
      console.log(`Trying instance: ${api}`);
      const res = await fetchWithTimeout(`${api}/streams/${videoId}`, 8000);
      if (!res.ok) {
        console.warn(`Instance ${api} returned ${res.status}`);
        continue;
      }
      const data = await res.json();
      console.log('Received streams shape:', Object.keys(data).join(', '));

      const audioStreams = (data.audioStreams || []).filter(s => s.mimeType && s.url);
      const videoStreams = (data.videoStreams || []).filter(s => s.mimeType && s.url);

      if (audioStreams.length === 0 && videoStreams.length === 0 && !data.hls) {
        console.warn('No streams or hls found from this instance');
        continue;
      }

      const scoredAudio = audioStreams.map(s => ({...s, score: scoreStream(s)})).sort((a,b) => b.score - a.score);
      const scoredVideo = videoStreams.map(s => ({...s, score: scoreStream(s)})).sort((a,b) => b.score - a.score);

      console.log('\nTop audio streams (by score):');
      scoredAudio.slice(0,5).forEach((s, idx) => console.log(`${idx+1}. ${s.mimeType} bitrate=${s.bitrate} score=${s.score} url=${s.url.substring(0,80)}...`));

      console.log('\nTop video streams (by score):');
      scoredVideo.slice(0,5).forEach((s, idx) => console.log(`${idx+1}. ${s.mimeType} bitrate=${s.bitrate} score=${s.score} url=${s.url.substring(0,80)}...`));

      if (scoredAudio.length > 0) {
        console.log('\nChosen (audio-only):', scoredAudio[0].url);
        return;
      }
      if (scoredVideo.length > 0) {
        console.log('\nChosen (video+audio):', scoredVideo[0].url);
        return;
      }
      if (data.hls) {
        console.log('\nChosen (hls):', data.hls);
        return;
      }
    } catch (err) {
      console.warn(`Error with instance ${api}:`, err && err.message ? err.message : err);
    }
  }
  console.error('All instances failed or returned no usable streams');
}

// Example: The Weeknd - Blinding Lights official video id
const videoId = process.argv[2] || '4NRXx6U8ABQ';
test(videoId).then(() => process.exit(0)).catch(() => process.exit(1));
