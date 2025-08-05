// Animación de fuegos artificiales en canvas
const canvas = document.getElementById('canvasFuegos');
const ctx = canvas.getContext('2d');
canvas.width = 480;
canvas.height = 320;

const colores = ['#ffd700', '#ee9ca7', '#d16ba5', '#fff', '#ffdde1', '#ff6f91'];

function random(min, max) {
    return Math.random() * (max - min) + min;
}

class Particula {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.radius = random(2, 4);
        this.color = color;
        this.angle = random(0, 2 * Math.PI);
        this.speed = random(2, 5);
        this.alpha = 1;
        this.decay = random(0.01, 0.03);
    }
    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.speed *= 0.98;
        this.alpha -= this.decay;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.restore();
    }
}

class FuegoArtificial {
    constructor() {
        this.x = random(80, canvas.width - 80);
        this.y = canvas.height;
        this.targetY = random(80, canvas.height / 2);
        this.color = colores[Math.floor(random(0, colores.length))];
        this.speed = random(4, 7);
        this.exploded = false;
        this.particulas = [];
    }
    update() {
        if (!this.exploded) {
            this.y -= this.speed;
            if (this.y <= this.targetY) {
                this.exploded = true;
                for (let i = 0; i < 32; i++) {
                    this.particulas.push(new Particula(this.x, this.y, this.color));
                }
            }
        } else {
            this.particulas.forEach(p => p.update());
            this.particulas = this.particulas.filter(p => p.alpha > 0);
        }
    }
    draw(ctx) {
        if (!this.exploded) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = this.color;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 8;
            ctx.fill();
            ctx.restore();
        } else {
            this.particulas.forEach(p => p.draw(ctx));
        }
    }
    terminado() {
        return this.exploded && this.particulas.length === 0;
    }
}

let fuegos = [];
function lanzarFuego() {
    fuegos.push(new FuegoArtificial());
}
setInterval(lanzarFuego, 1200);

function animar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    fuegos.forEach(f => {
        f.update();
        f.draw(ctx);
    });
    fuegos = fuegos.filter(f => !f.terminado());
    requestAnimationFrame(animar);
}
animar();

canvas.addEventListener('click', lanzarFuego);
