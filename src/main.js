import SamplerEngine from './SamplerEngine.js';
import SamplerGUI from './SamplerGUI.js';

// Initialisation du sampler : on diffère la création de l'AudioContext
// jusqu'à la première interaction utilisateur afin d'éviter les problèmes
// d'autoplay/suspension dans les navigateurs.
// On crée un EngineProxy qui construit paresseusement (lazy) le véritable
// SamplerEngine lorsque c'est nécessaire.

class EngineProxy {
  constructor() {
    this._engine = null;
    this._creating = null;
    /* Propriétés accessibles rapidement pour que l'interface puisse afficher
    des valeurs (trim/durée) avant la création effective du moteur. */
    this.startSec = 0;
    this.endSec = 0;
    this.duration = 0;
  }

  async _ensureEngine() {
    if (this._engine) return this._engine;
    if (!this._creating) {
      // Création asynchrone du contexte audio et du moteur.
      this._creating = (async () => {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const eng = new SamplerEngine(ctx);
        this._engine = eng;
        // Synchroniser les propriétés exposées par le proxy
        this.duration = eng.duration || 0;
        this.startSec = eng.startSec || 0;
        this.endSec = eng.endSec || 0;
        // Exposer l'instance réelle pour le debugging dans la console
        window.samplerEngine = eng;
        return eng;
      })();
    }
    return this._creating;
  }

  // Méthodes de chargement pour l'interface graphique
  async loadFromUrl(url) {
    const e = await this._ensureEngine();
    const buf = await e.loadFromUrl(url);
    this.duration = e.duration;
    this.startSec = e.startSec;
    this.endSec = e.endSec;
    return buf;
  }

  async loadFromFile(file) {
    const e = await this._ensureEngine();
    const buf = await e.loadFromFile(file);
    this.duration = e.duration;
    this.startSec = e.startSec;
    this.endSec = e.endSec;
    return buf;
  }

  async loadFromArrayBuffer(arrayBuffer) {
    const e = await this._ensureEngine();
    const buf = await e.loadFromArrayBuffer(arrayBuffer);
    this.duration = e.duration;
    this.startSec = e.startSec;
    this.endSec = e.endSec;
    return buf;
  }

  // Réglages de paramètres. Si le moteur n'existe pas encore, on lance
  // sa création en tâche de fond et on applique le réglage dès que possible.
  setGain(v) { (async () => { const e = await this._ensureEngine(); return e.setGain(v); })(); }
  setLoop(on) { (async () => { const e = await this._ensureEngine(); return e.setLoop(on); })(); }
  setRate(v) { (async () => { const e = await this._ensureEngine(); return e.setRate(v); })(); }
  // Les trims sont conservés localement pour permettre une UX réactive
  // avant que le moteur ne soit instancié.
  setTrimStart(sec) { this.startSec = sec; (async () => { const e = await this._ensureEngine(); return e.setTrimStart(sec); })(); }
  setTrimEnd(sec) { this.endSec = sec; (async () => { const e = await this._ensureEngine(); return e.setTrimEnd(sec); })(); }

  // Transport: démarrer / arrêter. Appels asynchrones vers le moteur réel.
  trigger() { (async () => { const e = await this._ensureEngine(); return e.trigger(); })(); }
  stop() { (async () => { const e = await this._ensureEngine(); return e.stop(); })(); }
}


window.addEventListener('load', async () => {
  const engineProxy = new EngineProxy();

  // Montage GUI
  const mount = document.querySelector('#app');
  if (!mount) {
    console.error('Sampler mount element #app not found in DOM.');
    return;
  }
  const gui = new SamplerGUI(engineProxy);
  gui.attach(mount);
});
