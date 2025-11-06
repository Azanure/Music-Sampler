import { distance } from './utils.js';

// Gestion des trimbars (barres de découpe) dessinées sur le canvas overlay.
// Fournit la logique de sélection, drag et dessin des barres gauche/droite.
export default class TrimbarsDrawer {
  leftTrimBar = { x: 0, color: 'white', selected: false, dragged: false };
  rightTrimBar = { x: 0, color: 'white', selected: false, dragged: false };

  constructor(canvas, leftTrimBarX, rightTrimBarX) {
    this.canvas = canvas;
    this.leftTrimBar.x = leftTrimBarX;
    this.rightTrimBar.x = rightTrimBarX;
    this.ctx = canvas.getContext('2d');
  }

  // Efface le canvas overlay
  clear() { this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  // Dessine les barres, les triangles indicateurs et les zones grisées extérieures
  draw() {
    let ctx = this.ctx;
    ctx.save();
    ctx.lineWidth = 2;
    ctx.strokeStyle = this.leftTrimBar.color;
    ctx.beginPath();
    ctx.moveTo(this.leftTrimBar.x, 0);
    ctx.lineTo(this.leftTrimBar.x, this.canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = this.rightTrimBar.color;
    ctx.moveTo(this.rightTrimBar.x, 0);
    ctx.lineTo(this.rightTrimBar.x, this.canvas.height);
    ctx.stroke();

    // Draw little triangles to indicate draggable handles
    ctx.fillStyle = this.leftTrimBar.color;
    ctx.beginPath();
    ctx.moveTo(this.leftTrimBar.x, 0);
    ctx.lineTo(this.leftTrimBar.x + 10, 8);
    ctx.lineTo(this.leftTrimBar.x, 16);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = this.rightTrimBar.color;
    ctx.moveTo(this.rightTrimBar.x, 0);
    ctx.lineTo(this.rightTrimBar.x - 10, 8);
    ctx.lineTo(this.rightTrimBar.x, 16);
    ctx.fill();

    // Zones masquées en gris en dehors des trims
    ctx.fillStyle = 'rgba(128,128,128,0.7)';
    ctx.fillRect(0, 0, this.leftTrimBar.x, this.canvas.height);
    ctx.fillRect(this.rightTrimBar.x, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
  }

  // Met en évidence la barre proche de la souris
  highLightTrimBarsWhenClose(mousePos) {
    let d = distance(mousePos.x, mousePos.y, this.leftTrimBar.x + 5, 4);
    const threshold = 10; // pixels sur l'axe X
    const nearLeft = Math.abs(mousePos.x - this.leftTrimBar.x) < threshold;
    const nearRight = Math.abs(mousePos.x - this.rightTrimBar.x) < threshold;

    if (nearLeft && !this.rightTrimBar.selected && !this.rightTrimBar.dragged) {
      this.leftTrimBar.color = 'red';
      this.leftTrimBar.selected = true;
    } else {
      this.leftTrimBar.color = 'white';
      this.leftTrimBar.selected = false;
    }

    if (nearRight && !this.leftTrimBar.selected && !this.leftTrimBar.dragged) {
      this.rightTrimBar.color = 'red';
      this.rightTrimBar.selected = true;
    } else {
      this.rightTrimBar.color = 'white';
      this.rightTrimBar.selected = false;
    }

    d = distance(mousePos.x, mousePos.y, this.rightTrimBar.x - 5, 4);
    if (d < 10 && !this.leftTrimBar.selected) { this.rightTrimBar.color = 'red'; this.rightTrimBar.selected = true; }
    else { this.rightTrimBar.color = 'white'; this.rightTrimBar.selected = false; }
  }

  // Commence le drag si une barre est sélectionnée
  startDrag() {
    if (this.leftTrimBar.selected) this.leftTrimBar.dragged = true;
    if (this.rightTrimBar.selected) this.rightTrimBar.dragged = true;
  }

  // Arrête le drag et empêche que les barres se croisent
  stopDrag() {
    if (this.leftTrimBar.dragged) {
      this.leftTrimBar.dragged = false; this.leftTrimBar.selected = false;
      if (this.leftTrimBar.x > this.rightTrimBar.x) this.leftTrimBar.x = this.rightTrimBar.x;
    }
    if (this.rightTrimBar.dragged) {
      this.rightTrimBar.dragged = false; this.rightTrimBar.selected = false;
      if (this.rightTrimBar.x < this.leftTrimBar.x) this.rightTrimBar.x = this.leftTrimBar.x;
    }
  }

  // Déplacement des barres avec clamp (bordure canvas + contrainte mutuelle)
  moveTrimBars(mousePos) {
    this.highLightTrimBarsWhenClose(mousePos);
    if (this.leftTrimBar.dragged) {
      const x = Math.max(0, Math.min(mousePos.x, this.rightTrimBar.x));
      this.leftTrimBar.x = x;
    }

    if (this.rightTrimBar.dragged) {
      const x = Math.min(this.canvas.width, Math.max(mousePos.x, this.leftTrimBar.x));
      this.rightTrimBar.x = x;
    }
  }
}
