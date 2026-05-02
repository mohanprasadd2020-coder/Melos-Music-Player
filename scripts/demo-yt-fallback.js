// Demo script to show yt fallback scoring/selection for one sample song
// Mirrors scoreStream logic from src/lib/youtube.ts

function scoreStream(stream) {
  const bitrate = Number(stream?.bitrate) || 0;
  const quality = typeof stream?.quality === 'string' ? parseInt(stream.quality, 10) || 0 : 0;
  const qualityLabel = typeof stream?.qualityLabel === 'string' ? parseInt(stream.qualityLabel, 10) || 0 : 0;

  const audioOnlyBonus = stream?.mimeType?.startsWith('audio/') ? 2000000 : 0;
  const videoAudioBonus = stream?.mimeType?.includes('audio') ? 500000 : 0;
  const hqPenalty = /preview|low|tiny|144p|240p/i.test(`${stream?.quality || ''} ${stream?.qualityLabel || ''}`) ? -2000000 : 0;

  return bitrate + quality + qualityLabel + audioOnlyBonus + videoAudioBonus + hqPenalty;
}

// Mocked streams for a sample video (e.g., Blinding Lights)
const sampleStreams = [
  {
    id: 'A',
    mimeType: 'audio/webm',
    bitrate: 192000,
    quality: undefined,
    qualityLabel: undefined,
    url: 'https://piped.example/audio_192.webm'
  },
  {
    id: 'B',
    mimeType: 'audio/mp4',
    bitrate: 64000,
    quality: undefined,
    qualityLabel: '144p',
    url: 'https://piped.example/audio_64.mp4'
  },
  {
    id: 'C',
    mimeType: 'video/mp4; codecs="avc1.4d401f, mp4a.40.2"',
    bitrate: 128000,
    quality: undefined,
    qualityLabel: '720p',
    url: 'https://piped.example/video_720.mp4'
  }
];

console.log('Demo: scoring sample streams for a video (mock)');
const scored = sampleStreams.map(s => ({ ...s, score: scoreStream(s) }));
scored.sort((a,b) => b.score - a.score);

console.log('\nScores:');
for (const s of scored) {
  console.log(`- ${s.id}: mime=${s.mimeType}, bitrate=${s.bitrate}, qualityLabel=${s.qualityLabel || 'n/a'}, score=${s.score}`);
}

const chosen = scored[0];
console.log(`\nChosen stream: ${chosen.id} -> ${chosen.url} (score=${chosen.score})`);

console.log('\nNotes: audio-only streams receive +2_000_000 bonus; video streams with audio get +500_000; low/preview streams get -2_000_000 penalty.');

// Exit with success
process.exit(0);
