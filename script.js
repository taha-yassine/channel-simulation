import { getReflection, getIntersection, getImage, argmin } from './utils.js';
import { Vector } from './vector.js';

/////////////
// Init
/////////////
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const plot = document.getElementById('plot');
const plotCtx = plot.getContext('2d');
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
const movingObstacles = [
  // Horizontal car
  { initP1: new Vector(200, 250), initP2: new Vector(200, 280), direction: new Vector(1,0), speed:1 },
  { initP1: new Vector(200, 280), initP2: new Vector(250, 280), direction: new Vector(1,0), speed:1 },
  { initP1: new Vector(250, 280), initP2: new Vector(250, 250), direction: new Vector(1,0), speed:1 },
  { initP1: new Vector(250, 250), initP2: new Vector(200, 250), direction: new Vector(1,0), speed:1 },

  // Vertical car
  { initP1: new Vector(200, 300), initP2: new Vector(200, 350), direction: new Vector(0,1), speed:.4 },
  { initP1: new Vector(200, 350), initP2: new Vector(230, 350), direction: new Vector(0,1), speed:.4 },
  { initP1: new Vector(230, 350), initP2: new Vector(230, 300), direction: new Vector(0,1), speed:.4 },
  { initP1: new Vector(230, 300), initP2: new Vector(200, 300), direction: new Vector(0,1), speed:.4 },
]
// Initialize the moving obstacles
for (const obstacle of movingObstacles) {
  obstacle.p1 = obstacle.initP1;
  obstacle.p2 = obstacle.initP2;
}
obstacles.push(...movingObstacles);


// Antenna config
const antenna = {
  p: new Vector(canvas.width - 50, canvas.height / 2),
  radius: 5
};

// Components
const speedSlider = document.getElementById('speed');
const bouncesSlider = document.getElementById('bounces');
const delaySlider = document.getElementById('delay');
const timeSlider = document.getElementById('time');

/////////////////////////
// Event listeners
/////////////////////////
canvas.addEventListener('mousedown', (event) => {
  if (!isPaused) {
    const { offsetX, offsetY } = event;
    currentOrigin = new Vector(offsetX, offsetY);
    shootRays(currentOrigin);
    delaySlider.value = 0;
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
  delaySlider.value = 0;
  isPaused = false;
  document.getElementById('pauseButton').textContent = 'Pause';
});
bouncesSlider.addEventListener('input', () => {
  if(currentOrigin) {
    shootRays(currentOrigin);
    delaySlider.value = 0;
  }
});
timeSlider.addEventListener('input', () => {
  for (const obstacle of movingObstacles) {
    obstacle.p1 = obstacle.initP1.add(obstacle.direction.multiply(timeSlider.value*obstacle.speed));
    obstacle.p2 = obstacle.initP2.add(obstacle.direction.multiply(timeSlider.value*obstacle.speed));
  }
  if(currentOrigin) {
    shootRays(currentOrigin);
  }
});

// Function to shoot rays in all directions from the clicked point
function shootRays(origin, method='image-source') {
  // Clear previous rays
  rays.length = 0;
  raylets.length = 0;

  if (method === 'sbr') {
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 90) {
      const direction = new Vector(Math.cos(angle), Math.sin(angle)); // Translate angle to unit direction vector
      const ray = {
        path: [origin],
        reachedMaxLength: false,
      };
      tracePathSBR(ray.path, direction, obstacles, bouncesSlider.value);
      rays.push(ray);
    }
  }
  else if (method === 'image-source') {
    tracePathImageSource({p:origin}, antenna.p, obstacles, bouncesSlider.value);
  }

  // Compute cumulative length of each ray
  for (const ray of rays) {
    ray.cumLength = ray.path.map((acc => (p,i) => acc += Vector.distanceBetween(ray.path[Math.max(i-1,0)],p))(0));
  }

  // Initialize a raylet for each ray
  rays.forEach((ray) => {
    raylets.push({
      head : 0, // Head of the raylet as the absolute distance from the origin of the ray
      ray: ray, // Corresponding ray
    });
  });
}

////////////
// SBR method
////////////

// Recursive function to do the SBR
// TODO: Handle corners
function tracePathSBR(path, direction, obstacles, bounces) {
  if (bounces >= 0) {
    let intersections = [];
    let refDirs = [];
    const raySegment = {
      p1: path[path.length - 1].add(direction.multiply(.01)), // Slightly offset the ray to avoid self-intersections
      p2: path[path.length - 1].add(direction.multiply(1000))
    };
    obstacles.forEach((obstacle) => {
      const [i, refDir] = getReflection(raySegment, obstacle);
      if (i) {
        intersections.push(i);
        refDirs.push(refDir);
      }
    });
    const idMin = argmin(intersections.map(i => i!=null ? Vector.distanceBetween(i, raySegment.p1) : Infinity));
    path.push(intersections[idMin]);
    tracePathSBR(path, refDirs[idMin], obstacles, bounces-1);
  }
}

////////////////////////
// Image-source method
////////////////////////

// Recursive function to trace the rays using the image-source method
function tracePathImageSource(source, receiver, obstacles, bounces) {
  if (bounces >= 0) {
    const ray = {
      path: constructPath(source, receiver, [receiver], obstacles),
    };
    if (ray.path) { rays.push(ray); }

    for (const obstacle of obstacles) {
      const image = getImage(source, obstacle);
      tracePathImageSource(image, receiver, obstacles, bounces-1);
    }
  }
}

// Recursive function to construct the path given an image
function constructPath(image, destination, path, obstacles) {
  const raySegment = {
    p1: image.p,
    p2: destination.add(image.p.subtract(destination).normalize().multiply(.01)), // Slightly offset the ray to avoid self-intersections
  };

  // Check if ray segment is obstructed
  const intersections = [];
  for (const obstacle of obstacles) {
    const intersection = getIntersection(raySegment, obstacle, true);
    intersections.push(intersection);
  }
  const idMin = argmin(intersections.map(i => i!=null ? Vector.distanceBetween(i, destination) : Infinity));
  
  const numIntersections = intersections.reduce((acc, i) => acc + (i!=null? 1 : 0), 0);
  if (numIntersections == 0) {
    if (!image.source) {
      // Ray section from original transmitter to current destination is unobstructed and valid
      path.unshift(image.p);
      return path;
    }
    else { return null; }
  }
  else if (obstacles[idMin] === image.obstacle) {
    path.unshift(intersections[idMin]);
    return constructPath(image.source, intersections[idMin], path, obstacles);
  }
  else { return null; }
}

///////////////////
// Raylets
///////////////////
function updateRaylets() {
  raylets.forEach((raylet) => {
    raylet.head = speedSlider.value*delaySlider.value;
  });
}

// Function to draw raylet
function rayletToPath(raylet, length=10) {
  // Cumulative length of the path segments
  const cumLength = raylet.ray.cumLength;
  
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

//////////////////
// Drawing
//////////////////
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

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  plotCtx.clearRect(0, 0, plot.width, plot.height);

  // Draw rays
  ctx.strokeStyle = 'lightgray';
  rays.forEach((ray) => {
      drawPath(ray.path);
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

  // Draw CIR plot
  // TODO: Improve path loss computation
  plotCtx.strokeStyle = 'black';
  for (const raylet of raylets) {
    const pathLength = raylet.ray.cumLength[raylet.ray.cumLength.length-1];
    if (raylet.head>pathLength) {
      const delay = pathLength/(speedSlider.value);
      const amplitude = 100/pathLength;
      const x = delay/(delaySlider.max)*plot.width;
      const y = (1-amplitude)*plot.height;
      plotCtx.beginPath();
      plotCtx.moveTo(x, plot.height);
      plotCtx.lineTo(x, y);
      plotCtx.stroke();
    }
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  if (!isPaused) {
    updateRaylets();
    draw();
    delaySlider.value++;
  }
}

animate();
