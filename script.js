// Init
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const rays = [];
let isPaused = false;

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

// Helpers
function distanceBetween(point1, point2) {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function angleBetween(point1, point2) {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.atan2(dy, dx);
}



// Function to shoot rays in all directions from the clicked point
function shootRays(originX, originY) {
  rays.length = 0; // Clear previous rays
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 180) {
    const ray = {
      headAngle: angle,
      tailAngle: angle,
      trail: [{ x: originX, y: originY }, { x: originX, y: originY }],
      speed: 2,
      reachedAntenna: false,
      maxLength: 300,
      reachedMaxLength: false,
    };
    rays.push(ray);
  }
}

// Function to update rays' positions and handle reflections
function updateRays() {
  rays.forEach((ray) => {
    if (!ray.reachedAntenna) {
      // Get the head point in the trail
      const headPoint = ray.trail[ray.trail.length - 1];
      const newX = headPoint.x + Math.cos(ray.headAngle) * ray.speed;
      const newY = headPoint.y + Math.sin(ray.headAngle) * ray.speed;

      // Check for canvas border collisions
      if (newX <= 0 || newX >= canvas.width || newY <= 0 || newY >= canvas.height) {
        // Calculate the reflection angle
        if (newX <= 0 || newX >= canvas.width) {
          ray.headAngle = Math.PI - ray.headAngle; // Reflect off left/right walls
        }
        if (newY <= 0 || newY >= canvas.height) {
          ray.headAngle = -ray.headAngle; // Reflect off top/bottom walls
        }
        // Add a new head point to the trail after reflection
        ray.trail.push({ x: headPoint.x, y: headPoint.y });
      } else {
        // No collision, just move the head point of the trail
        ray.trail[ray.trail.length - 1] = { x: newX, y: newY };
      }

      // Calculate the total length of the trail
      if (!ray.reachedMaxLength) {
        let totalLength = 0;
        for (let i = ray.trail.length - 1; i > 0; i--) {
          totalLength += distanceBetween(ray.trail[i], ray.trail[i - 1]);
        }
        ray.reachedMaxLength = totalLength > ray.maxLength;

      } else {
        // Move the tail point in the tail direction  
        const newTail = {
          x: ray.trail[0].x + Math.cos(ray.tailAngle) * ray.speed,
          y: ray.trail[0].y + Math.sin(ray.tailAngle) * ray.speed
        };
        ray.trail[0] = newTail;

        // If the tail reaches a bounce point, update it
        if (distanceBetween(ray.trail[0], ray.trail[1]) < 0.1) {
          ray.trail.shift();
          ray.tailAngle = angleBetween(ray.trail[0], ray.trail[1]);
        }
      }

    }
  });
}

// Function to draw rays and antenna on the canvas
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  // Draw antenna
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(antenna.x, antenna.y, antenna.radius, 0, 2 * Math.PI);
  ctx.fill();

  // Draw rays
  ctx.strokeStyle = 'black';
  rays.forEach((ray) => {
    if (!ray.reachedAntenna) {
      ctx.beginPath();
      ray.trail.forEach((point, index) => {
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
    updateRays();
    draw();
  }
}

animate();
