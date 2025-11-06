import WaveformDrawer from './WaveFormDrawer.js';
import TrimbarsDrawer from './TrimBarsDrawer.js';
import { pixelToSeconds, secondsToPixel } from './utils.js';

// Visualiseur de forme d'onde + trimbars.
// Cette classe orchestre le dessin sur les deux canevas (forme et overlay)
// et émet des callbacks lorsque les trims changent.
export default class WaveFormVisualizer {
  constructor(canvas, overlayCanvas) {
    this.canvas = canvas;
    this.overlay = overlayCanvas;
    this.wf = new WaveformDrawer();
    // Position par défaut des trim bars (10% / 90%) avant chargement du buffer
    this.trims = new TrimbarsDrawer(overlayCanvas, 20, Math.max(40, overlayCanvas.width - 20));
    this._onTrimChange = null;
    this._buffer = null;
    this._animating = false;
  }

  init(buffer, color = '#83E83E') {
    this._buffer = buffer;
  // Synchroniser la taille interne du canvas avec la taille CSS pour un dessin net
    const dpr = window.devicePixelRatio || 1;
    const desiredW = Math.max(1, Math.floor(this.canvas.clientWidth * dpr));
    const desiredH = Math.max(1, Math.floor(this.canvas.clientHeight * dpr));
    if (this.canvas.width !== desiredW) this.canvas.width = desiredW;
    if (this.canvas.height !== desiredH) this.canvas.height = desiredH;
    if (this.overlay.width !== desiredW) this.overlay.width = desiredW;
    if (this.overlay.height !== desiredH) this.overlay.height = desiredH;

    // Calculer les peaks et dessiner la forme d'onde
    this.wf.init(buffer, this.canvas, color);
    this.wf.drawWave(0, this.canvas.height);
    // Installer la gestion souris / drag des trims
    this._setupMouse();
    // Démarrer l'animation continue des trim bars
    this._startAnim();
  }

  // Met à jour la position des trimbars en secondes
  setTrimSeconds(startS, endS) {
    if (!this._buffer) return;
    const w = this.canvas.width;
    const dur = this._buffer.duration || 1;
    this.trims.leftTrimBar.x = secondsToPixel(startS, dur, w);
    this.trims.rightTrimBar.x = secondsToPixel(endS, dur, w);
  }

  // Retourne les trims (start/end) en secondes selon la position des barres
  getTrimSeconds() {
    if (!this._buffer) return { start: 0, end: 0 };
    const dur = this._buffer.duration;
    const w = this.canvas.width;
    const start = pixelToSeconds(this.trims.leftTrimBar.x, dur, w);
    const end = pixelToSeconds(this.trims.rightTrimBar.x, dur, w);
    return { start, end };
  }

  onTrimChange(cb) { this._onTrimChange = cb; }

  _setupMouse() {
    if (this._mouseSetupDone) return;
    this._mouseSetupDone = true;
    const canvas = this.canvas;
    const overlay = this.overlay;
    const mousePos = { x: 0, y: 0 };

    overlay.onmousemove = (evt) => {
      const rect = canvas.getBoundingClientRect();
      // Conversion des coordonnées CSS vers les coordonnées internes du canvas
      const scaleX = this.overlay.width / rect.width;
      const scaleY = this.overlay.height / rect.height;
      mousePos.x = (evt.clientX - rect.left) * scaleX;
      mousePos.y = (evt.clientY - rect.top) * scaleY;
      // Déplacer les trimbars si nécessaire et émettre l'événement
      this.trims.moveTrimBars(mousePos);
      this._emitTrim();
    };
    overlay.onmousedown = () => { this.trims.startDrag(); };
    overlay.onmouseup = () => { this.trims.stopDrag(); this._emitTrim(); };
    overlay.onmouseleave = () => { this.trims.stopDrag(); };
  }

  _startAnim() {
    if (this._animating) return;
    this._animating = true;
    const loop = () => {
      this.trims.clear();
      this.trims.draw();
      if (this._animating) requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  _emitTrim() {
    if (!this._onTrimChange || !this._buffer) return;
    this._onTrimChange(this.getTrimSeconds());
  }
}
