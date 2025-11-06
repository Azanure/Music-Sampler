// Utilitaires pour charger et décoder des sons avec WebAudio
async function loadAndDecodeSound(url, ctx) {
  // Charge une ressource audio via fetch puis la décode en AudioBuffer
  const response = await fetch(url);
  const sound = await response.arrayBuffer();
  const decodedSound = await ctx.decodeAudioData(sound);
  return decodedSound;
}

async function decodeArrayBuffer(ctx, arrayBuffer) {
  // Décodage direct d'un ArrayBuffer en AudioBuffer
  return await ctx.decodeAudioData(arrayBuffer);
}

function buildAudioGraph(ctx, buffer, destination = ctx.destination) {
  // Crée une source bufferée et la connecte à la destination indiquée
  // (le caller peut insérer un gain ou d'autres nœuds entre-temps)
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.connect(destination);
  return source;
}

function playSound(ctx, buffer, startTime, endTime) {
  // Lecture simple d'un buffer entre startTime et endTime
  if (startTime < 0) startTime = 0;
  if (endTime > buffer.duration) endTime = buffer.duration;
  const duration = Math.max(0, endTime - startTime);
  const src = buildAudioGraph(ctx, buffer);
  src.start(0, startTime, duration);
}

export { loadAndDecodeSound, decodeArrayBuffer, buildAudioGraph, playSound };
