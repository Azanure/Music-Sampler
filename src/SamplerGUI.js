import WaveformVisualizer from './WaveformVisualizer.js';
import { secondsToPixel } from './utils.js';

// Interface graphique (GUI) du sampler. Peut être montée dans n'importe quel
// conteneur DOM et interagit avec une instance de SamplerEngine (ou un proxy).
// Responsabilités : gérer les contrôles utilisateur, charger des fichiers/URLs,
// et afficher le waveform + les trim bars.
export default class SamplerGUI {
  constructor(engine) {
    this.engine = engine;
    this.root = null;
    this.canvas = null;
    this.canvasOverlay = null;
    this.viz = null;
  }

  attach(container) {
    if (!container) {
      console.error('SamplerGUI.attach called with null container');
      return;
    }
    // Build DOM
    const root = document.createElement('div');
    root.className = 'panel';

    root.innerHTML = `
      <div class="row nowrap">
        <label>Load file</label>
        <input type="file" id="fileInput" accept="audio/*" />
        <label>or URL</label>
        <input type="url" id="urlInput" placeholder="https://..." />
        <button id="btnLoadUrl">Load</button>
        <button id="btnStop" disabled>Stop</button>
        <button id="btnPlay" class="primary" disabled>Play</button>
      </div>
      <div class="row">
        <label>Gain</label>
        <input type="range" id="gain" min="0" max="2" step="0.01" value="1" />
        <label>Rate</label>
        <input type="range" id="rate" min="0.25" max="4" step="0.01" value="1" />
        <label><input type="checkbox" id="loop" /> Loop</label>
        <span class="hint">Trim bars set start/end. Works headless too.</span>
      </div>
      <div class="row">
        <div class="canvases">
          <canvas id="wave" width="840" height="180"></canvas>
          <canvas id="overlay" class="overlay" width="840" height="180"></canvas>
        </div>
      </div>
      <div class="row">
        <div id="presetsPanel" class="panel" style="width:100%">
          <div class="hint">Presets from /presets/*.json — click a sound to load it.</div>
          <div id="presetsContent"></div>
        </div>
      </div>
    `;

    container.appendChild(root);
    this.root = root;
    this.canvas = root.querySelector('#wave');
    this.canvasOverlay = root.querySelector('#overlay');

    // Raccrocher les contrôles de l'UI aux méthodes du moteur
    const fileInput = root.querySelector('#fileInput');
    const urlInput = root.querySelector('#urlInput');
    const btnLoadUrl = root.querySelector('#btnLoadUrl');
    const btnPlay = root.querySelector('#btnPlay');
    const btnStop = root.querySelector('#btnStop');
    const gain = root.querySelector('#gain');
    const rate = root.querySelector('#rate');
    const loop = root.querySelector('#loop');

    // Les événements modifient directement les paramètres du moteur audio
    gain.addEventListener('input', () => this.engine.setGain(gain.value));
    rate.addEventListener('input', () => this.engine.setRate(rate.value));
    loop.addEventListener('change', () => this.engine.setLoop(loop.checked));

    // Chargement via fichier local
    fileInput.addEventListener('change', async () => {
      if (!fileInput.files || !fileInput.files[0]) return;
      const buf = await this.engine.loadFromFile(fileInput.files[0]);
      this._afterBufferLoaded(buf);
    });
    const loadUrl = async () => {
      if (!urlInput.value) return;
      const buf = await this.engine.loadFromUrl(urlInput.value);
      this._afterBufferLoaded(buf);
    };
    btnLoadUrl.addEventListener('click', loadUrl);
    urlInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadUrl();
    });

    // Play / Stop : si l'engine n'existe pas encore, le proxy le créera
    btnPlay.addEventListener('click', () => this.engine.trigger());
    btnStop.addEventListener('click', () => this.engine.stop());

    // Visualizer : instancié après chargement d'un buffer
    // Charger la liste de presets et construire les boutons
    this._loadPresets(root.querySelector('#presetsContent'));
  }

  // Appelé après qu'un AudioBuffer a été chargé et décodé
  _afterBufferLoaded(buffer) {
    const btnPlay = this.root.querySelector('#btnPlay');
    const btnStop = this.root.querySelector('#btnStop');
    btnPlay.disabled = false;
    btnStop.disabled = false;

    // Créer ou mettre à jour le visualiseur de forme d'onde
    if (!this.viz) {
      this.viz = new WaveformVisualizer(this.canvas, this.canvasOverlay);
      this.viz.onTrimChange(({ start, end }) => {
        this.engine.setTrimStart(start);
        this.engine.setTrimEnd(end);
      });
    }
    this.viz.init(buffer, '#83E83E');

    // Forcer réinitialisation des trims à chaque nouveau son
    const dur = buffer.duration;
    this.engine.setTrimStart(0);
    this.engine.setTrimEnd(dur);
    this.viz.setTrimSeconds(0, dur);
  }

  async _loadPresets(container) {
    if (!container) return;
    try {
      const listResp = await fetch('presets/presets.json');
      const list = await listResp.json();
      for (const item of list) {
        await this._addPresetCategory(container, item);
      }
    } catch (e) {
      console.error('Failed to load presets:', e);
      container.innerHTML = '<div style="color:#f88">Failed to load presets.</div>';
    }
  }

  async _addPresetCategory(container, item) {
    try {
      const resp = await fetch(`presets/${item.file}`);
      const preset = await resp.json();

      const section = document.createElement('section');
      section.className = 'preset-category';
      const title = document.createElement('h3');
      title.textContent = preset.name || item.name || 'Preset';
      title.style.margin = '8px 0';
      const grid = document.createElement('div');
      grid.className = 'preset-grid';

      (preset.samples || []).forEach((s) => {
        const btn = document.createElement('button');
        btn.textContent = s.name || s.url;
        btn.title = s.url;
        btn.addEventListener('click', async () => {
          const url = 'presets/' + (s.url || '').replace(/^\.\//, '');
          const buf = await this.engine.loadFromUrl(url);
          this._afterBufferLoaded(buf);
        });
        grid.appendChild(btn);
      });

      section.appendChild(title);
      section.appendChild(grid);
      container.appendChild(section);
    } catch (e) {
      console.error('Failed to load preset file', item, e);
    }
  }
}
