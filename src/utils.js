// Petites fonctions utilitaires utilisées par le visualiseur et les trimbars
function distance(x1, y1, x2, y2) {
  // Distance euclidienne entre deux points
  let y = x2 - x1;
  let x = y2 - y1;
  return Math.sqrt(x * x + y * y);
}

function pixelToSeconds(x, bufferDuration, canvasWidth) {
  // Convertit une position en pixels sur le canvas en secondes (durée de buffer)
  return (x * bufferDuration) / canvasWidth;
}

function secondsToPixel(t, bufferDuration, canvasWidth) {
  // Convertit un temps (s) en position pixel sur le canvas
  return (t * canvasWidth) / bufferDuration;
}

export { distance, pixelToSeconds, secondsToPixel };
