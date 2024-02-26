import { getReflection, argmin } from './utils.js';
import { Vector } from './vector.js';

// Init
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rays = [];
let isPaused = false;
const obstacles = [
  { p1: new Vector(0, 0), p2: new Vector(canvas.width, 0) },
  { p1: new Vector(0, 0), p2: new Vector(0, canvas.height) },
  { p1: new Vector(canvas.width, 0), p2: new Vector(canvas.width, canvas.height) },
  { p1: new Vector(0, canvas.height), p2: new Vector(canvas.width, canvas.height) },
  { p1: new Vector(100, 400), p2: new Vector(200, 100) }
];

// Antenna config
const antenna = {
  p: new Vector(canvas.width - 50, canvas.height / 2),
  radius: 10
};

// Event listeners
canvas.addEventListener('mousedown', (event) => {
  if (!isPaused) {
    const { offsetX, offsetY } = event;
    shootRays(offsetX, offsetY);
  }
});
document.getElementById('pauseButton').addEventListener('click', (e) => {
  isPaused = !isPaused;
  if (!isPaused) {
    animate();
    e.currentTarget.textContent = 'Pause';
  }
  else {
    e.currentTarget.textContent = 'Resume';     
  }
});
document.getElementById('resetButton').addEventListener('click', () => {
  rays.length = 0;
  isPaused = false;
  document.getElementById('pauseButton').textContent = 'Pause';
  animate();
});


// Function to shoot rays in all directions from the clicked point
function shootRays(originX, originY) {
  rays.length = 0; // Clear previous rays
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
    const direction = new Vector(Math.cos(angle), Math.sin(angle)); // Translate angle to unit direction vector
    const ray = {
      path: [new Vector(originX, originY)],
      speed: 2,
      reachedAntenna: false,
      maxBounces: 3,
      reachedMaxLength: false,
    };
    tracePath(ray.path, direction, obstacles, ray.maxBounces);
    rays.push(ray);
  }
}

// Recursive function to do the ray tracing
// TODO: Handle corners
function tracePath(path, direction, obstacles, bounces) {
  bounces--;
  if (bounces >= -1) {
    let intersections = [];
    let refDirs = [];
    const raySegment = {
      p1: path[path.length - 1].add(direction.multiply(.01)), // Slightly offset the ray to avoid self-intersections
      p2: path[path.length - 1].add(direction.multiply(1000))
    };
    obstacles.forEach((obstacle) => {
      const [i, refDir] = getReflection(raySegment, obstacle);
      intersections.push(i);
      refDirs.push(refDir);
    });
    const idMin = argmin(intersections.map(i => i!=null ? Vector.distanceBetween(i, raySegment.p1) : Infinity));
    path.push(intersections[idMin]);
    tracePath(path, refDirs[idMin], obstacles, bounces);
  }
}

// Function to draw rays and antenna on the canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw antenna
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(antenna.p.x, antenna.p.y, antenna.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw obstacles
  ctx.strokeStyle = 'red';
  obstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.moveTo(obstacle.p1.x, obstacle.p1.y);
    ctx.lineTo(obstacle.p2.x, obstacle.p2.y);
    ctx.stroke();
  });

  // Draw rays
  ctx.strokeStyle = 'black';
  rays.forEach((ray) => {
    if (!ray.reachedAntenna) {
      ctx.beginPath();
      ray.path.forEach((point, index) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      ctx.stroke();
    }
  });
}

// Animation loop
function animate() {
  if (!isPaused) { 
    requestAnimationFrame(animate);
    draw();
  }
}

animate();
