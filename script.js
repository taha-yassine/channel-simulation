import { getReflection, argmin } from './utils.js';
import { Vector } from './vector.js';

// Components
const speedSlider = document.getElementById('speed');
const bouncesSlider = document.getElementById('bounces');
const timeSlider = document.getElementById('time');

// Init
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rays = [];
const raylets = [];
let isPaused = false;
let currentOrigin;
const obstacles = [
  { p1: new Vector(0, 0), p2: new Vector(canvas.width, 0) },
  { p1: new Vector(0, 0), p2: new Vector(0, canvas.height) },
  { p1: new Vector(canvas.width, 0), p2: new Vector(canvas.width, canvas.height) },
  { p1: new Vector(0, canvas.height), p2: new Vector(canvas.width, canvas.height) },
  { p1: new Vector(100, 400), p2: new Vector(200, 100) },
  { p1: new Vector(300, 500), p2: new Vector(700, 400) },
  { p1: new Vector(500, 100), p2: new Vector(700, 150) },
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
    timeSlider.value = 0;
  }
});
document.getElementById('pauseButton').addEventListener('click', (e) => {
  isPaused = !isPaused;
  if (!isPaused) {
    e.currentTarget.textContent = 'Pause';
  }
  else {
    e.currentTarget.textContent = 'Resume';     
  }
});
document.getElementById('resetButton').addEventListener('click', () => {
  rays.length = 0;
  raylets.length = 0;
  timeSlider.value = 0;
  isPaused = false;
  document.getElementById('pauseButton').textContent = 'Pause';
});
bouncesSlider.addEventListener('input', () => {
  if(currentOrigin) {
    shootRays(currentOrigin.x, currentOrigin.y);
  }
});

// Function to shoot rays in all directions from the clicked point
function shootRays(originX, originY) {
  // Register origin
  currentOrigin = new Vector(originX, originY);

  timeSlider.value = 0;

  // Clear previous rays
  rays.length = 0;
  raylets.length = 0;

  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 90) {
    const direction = new Vector(Math.cos(angle), Math.sin(angle)); // Translate angle to unit direction vector
    const ray = {
      path: [new Vector(originX, originY)],
      reachedAntenna: false,
      maxBounces: bouncesSlider.value,
      reachedMaxLength: false,
    };
    tracePath(ray.path, direction, obstacles, ray.maxBounces);
    rays.push(ray);

    // Initialize a raylet for each ray
    raylets.push({
      head : 0, // Head of the raylet as the absolute distance from the origin of the ray
      ray: ray, // Corresponding ray
    });
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

function updateRaylets() {
  raylets.forEach((raylet) => {
    raylet.head = speedSlider.value*timeSlider.value;
  });
}

function drawPath(path) {
  ctx.beginPath();
  path.forEach((point, index) => {
    if (index === 0) {
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
    }
  });
  ctx.stroke();
}

// Function to draw raylet
function rayletToPath(raylet, length=10) {
  // Cumulative length of the path segments
  const cumLength = raylet.ray.path.map((acc => (p,i) => acc += Vector.distanceBetween(raylet.ray.path[Math.max(i-1,0)],p))(0));
  
  let head = Math.min(cumLength[cumLength.length-1], raylet.head); // Bound the head
  let tail = Math.max(head - length,0);
  let start = 0;
  let end = 0;

  // Find the path nodes included in the raylet
  for (const [i,l] of cumLength.entries()) {
    if (tail < l) {
      start = i-1; // Node that comes before tail
      for (const [j,l] of cumLength.slice(i).entries()) {
        if (head <= l) {
          end = i+j; // Node that comes after head
          break;
        }
      }
      break;
    }
  }

  // Construct the raylet path
  const rayletPath = raylet.ray.path.slice(start,end+1);

  // Replace head and tail with their interpolated coordinates
  rayletPath[rayletPath.length-1] = Vector.lerp(raylet.ray.path[end-1],raylet.ray.path[end],(head-cumLength[end-1])/(cumLength[end]-cumLength[end-1]));
  rayletPath[0] = Vector.lerp(raylet.ray.path[start],raylet.ray.path[start+1],(tail-cumLength[start])/(cumLength[start+1]-cumLength[start]));

  return rayletPath;
}

// Function to draw rays and antenna on the canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw rays
  ctx.strokeStyle = 'lightgray';
  rays.forEach((ray) => {
    if (!ray.reachedAntenna) {
      drawPath(ray.path);
    }
  });
  
  // Draw antenna
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(antenna.p.x, antenna.p.y, antenna.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw obstacles
  ctx.strokeStyle = 'black';
  obstacles.forEach((obstacle) => {
    ctx.beginPath();
    ctx.moveTo(obstacle.p1.x, obstacle.p1.y);
    ctx.lineTo(obstacle.p2.x, obstacle.p2.y);
    ctx.stroke();
  });

  // Draw raylets
  ctx.strokeStyle = 'red';
  raylets.forEach((raylet) => {
    drawPath(rayletToPath(raylet));
  });
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    updateRaylets();
    draw();
    timeSlider.value++;
  }
}

animate();
