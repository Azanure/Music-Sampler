import { decodeArrayBuffer, loadAndDecodeSound } from './SoundUtils.js';

// Module moteur uniquement : peut être utilisé sans interface graphique (headless).
// Contrat :
// - Entrées : AudioBuffer décodé ou URL / Fichier / ArrayBuffer
// - Paramètres : gain, loop, playback rate, trims (start/end en secondes)
// - Méthodes publiques : loadFromUrl, loadFromFile, loadFromArrayBuffer, setBuffer,
//   trigger, stop, setters/getters
// - Sortie : envoie le son via this.gainNode -> audioContext.destination (par défaut)
// Remarque : cette classe ne gère pas l'UI ; elle expose une API testable et réutilisable.
export default class SamplerEngine {
  constructor(audioContext) {
    if (!audioContext) throw new Error('SamplerEngine requires an AudioContext');
    this.ctx = audioContext;
    this.gainNode = this.ctx.createGain();
    this.gainNode.gain.value = 1.0;
    this.output = this.gainNode;
    this.output.connect(this.ctx.destination);

    this.buffer = null;
    this.loop = false;
    this.playbackRate = 1.0;
    this.startSec = 0;
    this.endSec = 0; // 0 veut dire utiliser la fin du buffer
    this._source = null;
  }

  // Chargement de sons
  async loadFromUrl(url) {
    this.buffer = await loadAndDecodeSound(url, this.ctx);
    // Réinitialiser les trims à chaque nouveau chargement
    this.startSec = 0;
    this.endSec = 0; // 0 => sera remplacé par duration dans _ensureTrims
    this._ensureTrims();
    return this.buffer;
  }

  async loadFromFile(file) {
    const arr = await file.arrayBuffer();
    this.buffer = await decodeArrayBuffer(this.ctx, arr);
    // Réinitialiser les trims à chaque nouveau chargement
    this.startSec = 0;
    this.endSec = 0;
    this._ensureTrims();
    return this.buffer;
  }

  async loadFromArrayBuffer(arrayBuffer) {
    this.buffer = await decodeArrayBuffer(this.ctx, arrayBuffer);
    // Réinitialiser les trims à chaque nouveau chargement
    this.startSec = 0;
    this.endSec = 0;
    this._ensureTrims();
    return this.buffer;
  }

  setBuffer(decodedBuffer) {
    this.buffer = decodedBuffer;
    this._ensureTrims();
  }

  // Paramètres
  setGain(v) {
    this.gainNode.gain.value = Math.max(0, Number(v));
  }
  setLoop(on) {
    this.loop = !!on;
  }
  setRate(v) {
    this.playbackRate = Math.max(0.01, Number(v));
  }
  setTrimStart(sec) {
    this.startSec = Math.max(0, Number(sec));
  }
  setTrimEnd(sec) {
    this.endSec = Math.max(0, Number(sec));
  }

  // Getters
  get duration() {
    return this.buffer ? this.buffer.duration : 0;
  }

  // Transport
  trigger(when = 0) {
    if (!this.buffer) throw new Error('No buffer loaded');
    this.stop();
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffer;
    src.loop = this.loop;
    src.playbackRate.value = this.playbackRate;
    src.connect(this.gainNode);

    const start = Math.min(this.startSec, this.buffer.duration);
    const end =
      this.endSec && this.endSec > 0
        ? Math.min(this.endSec, this.buffer.duration)
        : this.buffer.duration;
    const dur = Math.max(0, end - start);
    try {
      if (this.loop) {
        src.loopStart = start;
        src.loopEnd = end;
        src.start(this.ctx.currentTime + when, start);
      } else {
        src.start(this.ctx.currentTime + when, start, dur);
      }
      this._source = src;
    } catch (e) {
      console.error('SamplerEngine.trigger error:', e);
    }
  }

  stop() {
    if (this._source) {
      try {
        this._source.stop();
      } catch {}
      this._source.disconnect();
      this._source = null;
    }
  }

  _ensureTrims() {
    if (!this.buffer) return;
    if (this.startSec < 0) this.startSec = 0;
    if (!this.endSec || this.endSec <= 0 || this.endSec > this.buffer.duration) {
      this.endSec = this.buffer.duration;
    }
  }
}
