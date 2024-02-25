import { distanceBetween, getReflection, argmin } from './utils.js';

// Init
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rays = [];
let isPaused = false;
const obstacles = [
  { p1: { x: 0, y: 0 }, p2: { x: canvas.width, y: 0 } },
  { p1: { x: 0, y: 0 }, p2: { x: 0, y: canvas.height } },
  { p1: { x: canvas.width, y: 0 }, p2: { x: canvas.width, y: canvas.height } },
  { p1: { x: 0, y: canvas.height }, p2: { x: canvas.width, y: canvas.height } }
];

// Antenna config
const antenna = {
  x: canvas.width - 50, // Example position, adjust as needed
  y: canvas.height / 2,
  radius: 10 // Example size, adjust as needed
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
    const direction = { x: Math.cos(angle), y: Math.sin(angle) }; // Translate angle to unit direction vector
    const ray = {
      path: [{ x: originX, y: originY }],
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
      p1:{
        // Slightly offset the ray to avoid self-intersections
        x:path[path.length - 1].x+direction.x*.01,
        y:path[path.length - 1].y+direction.y*.01,
      },
      p2:{
        x:path[path.length - 1].x+direction.x*1000,
        y:path[path.length - 1].y+direction.y*1000,
      }
    };
    obstacles.forEach((obstacle) => {
      const [i, refDir] = getReflection(raySegment, obstacle);
      intersections.push(i);
      refDirs.push(refDir);
    });
    const idMin = argmin(intersections.map(i => distanceBetween(i, raySegment.p1) ?? Infinity));
    path.push(intersections[idMin]);
    tracePath(path, refDirs[idMin], obstacles, bounces);
  }
}
}

// Function to draw rays and antenna on the canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw antenna
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(antenna.x, antenna.y, antenna.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw obstacles
  ctx.strokeStyle = 'red';
  obstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.moveTo(obstacle.x1, obstacle.y1);
    ctx.lineTo(obstacle.x2, obstacle.y2);
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
