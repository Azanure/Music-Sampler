<div align="center">

# Music Sampler

Petit sampler WebAudio modulaire : un moteur réutilisable (`SamplerEngine`) et une interface optionnelle (`SamplerGUI`) avec visualisation de forme d'onde et barres de découpe (trim) interactives.

Groupe : Cazacu Ion et Virgile Lassagne
=======

</div>

## Aperçu
Ce projet permet de charger un fichier audio local ou une URL, d'en ajuster le point de départ et la fin, le gain, la vitesse de lecture (playback rate) et le looping, puis de jouer la portion choisie. Les barres de trim sont manipulables directement sur l'overlay du waveform.

## Fonctionnalités
- Chargement de sons : fichier local, URL distante, presets embarqués (`/presets/*.json`).
- Décodage en `AudioBuffer` via Web Audio API.
- Trims visuels (début / fin) avec mise à jour en temps réel.
- Loop activable (avec `loopStart` / `loopEnd`).
- Contrôle du volume (Gain) et de la vitesse (Playback Rate).
- Mode headless (utilisation de l'engine sans GUI, via la console).
- Visualisation de la forme d'onde avec calcul de "peaks" simplifiés.
- Architecture modulaire (drawer waveform / drawer trimbars / visualizer orchestrateur).

## Structure du projet
```
public/
	styles.css            # Style général (thème sombre)
src/
	main.js               # Bootstrap (montage GUI + lazy AudioContext)
	SamplerEngine.js      # Moteur audio réutilisable (API headless)
	SamplerGUI.js         # Interface utilisateur + chargement presets
	WaveFormVisualizer.js # Orchestrateur waveform + trim bars
	WaveFormDrawer.js     # Dessin de la forme d'onde
	TrimBarsDrawer.js     # Logique & dessin des barres de trim
	SoundUtils.js         # Fonctions de chargement/décodage
	utils.js              # Conversion pixels <-> secondes & distance
presets/
	presets.json          # Index des fichiers de presets
	*.json                # Collections de samples (avec URLs relatives)
index.html            # Page d'entrée
package.json            # Scripts Vite + outils dev (ESLint, Prettier)
README.md               # Ce document
```

## Prérequis
- Node.js ≥ 18 recommandé (Vite 5).
- Navigateur moderne supportant Web Audio (Chrome, Firefox, Edge, Safari).

## Installation
```bash
git clone https://github.com/Azanure/Music-Sampler
cd music-sampler
npm install
```

## ▶Lancement en développement
```bash
npm run dev
```
Ouvrez l'URL indiquée par Vite (souvent `http://localhost:5173`).
Si la page reste vide, essayez d'ouvrir explicitement `http://localhost:5173/index.html`.

## Build de production + prévisualisation
```bash
npm run build
npm run preview
```

## Utilisation (GUI)
1. Cliquez sur "Load file" et choisissez un fichier audio OU entrez une URL puis "Load".
2. Une fois le waveform affiché, ajustez les barres de trim (drag sur l'overlay) pour définir la portion à jouer.
3. Réglez Gain, Rate et cochez Loop si nécessaire.
4. Appuyez sur "Play" pour lancer, "Stop" pour arrêter.

### Mode Headless (console)
Ouvrez les DevTools et utilisez `window.samplerEngine` (instancié après le premier chargement ou interaction) :
```js
// Exemple rapide en console
await samplerEngine.loadFromUrl('presets/808/kick.wav');
samplerEngine.setTrimStart(0.05);
samplerEngine.setTrimEnd(0.30);
samplerEngine.setGain(1.2);
samplerEngine.setRate(0.8);
samplerEngine.trigger();
```

## 🎛 Presets
Les presets sont décrits sous forme de fichiers JSON dans `presets/` et indexés par `presets/presets.json`. Chaque preset contient un tableau `samples` avec des objets `{ name, url }`. Cliquer sur un bouton charge le sample correspondant.

## API principale (`SamplerEngine`)
Méthodes clés :
- `loadFromUrl(url)` / `loadFromFile(file)` / `loadFromArrayBuffer(buf)`
- `setGain(v)` / `setLoop(on)` / `setRate(v)`
- `setTrimStart(sec)` / `setTrimEnd(sec)`
- `trigger()` / `stop()`
- Propriétés : `duration`, `startSec`, `endSec`, `loop`, `playbackRate`

### Cycle interne
1. Décodage du buffer → stockage.
2. Ajustement auto des trims si `endSec` non défini.
3. `trigger()` crée un `BufferSource`, configure loop/rate, démarre lecture sur la fenêtre [startSec, endSec].
4. `stop()` arrête et libère la source.

## Architecture visuelle
`WaveFormVisualizer` orchestre deux canvas :
- Base : waveform dessiné par `WaveFormDrawer`.
- Overlay : barres de trim dessinées et animées par `TrimBarsDrawer`.
Événements souris → mise à jour trims → callback `onTrimChange` → mise à jour moteur.

## Scripts NPM
```bash
npm run dev      # Serveur de dev Vite
npm run build    # Build production dans dist/
npm run preview  # Preview locale du build
npm run lint     # ESLint sur .js
npm run format   # Formatage Prettier
```

## Bonnes pratiques / Conseils
- L'`AudioContext` est créé paresseusement pour éviter les blocages d'autoplay.
- Gardez le sample court pour un rendu waveform rapide.
- Évitez un `playbackRate` trop bas (<0.25) qui peut dégrader l'audibilité.
- En mode loop, vérifiez que `startSec < endSec` pour éviter une boucle vide.

## FAQ
**Pourquoi je ne peux pas jouer immédiatement après le chargement de la page ?**
Les navigateurs exigent souvent une interaction utilisateur avant d'autoriser la création ou la reprise d'un `AudioContext`.

**Puis-je router le son ailleurs que vers la sortie ?**
Oui : utilisez `samplerEngine.output.disconnect()` puis connectez-la à vos propres nœuds.

**Le waveform est tronqué ou "pixelisé" ?**
Assurez-vous que le canvas s'adapte au DPR (géré dans `WaveFormVisualizer.init`).

## Licence
Projet académique / démonstration.

Bon sampling !
