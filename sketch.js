// Phase 1: Mouse Drawing with Point Resampling + Sliders

let userPoints = [];        // Raw points from mouse
let resampledPoints = [];   // Evenly spaced points
let fourierComponents = [];
let time = 0;
let path = [];

let isDrawing = false;
let hasDrawing = false;

// UI State
let numCircles = 150;       // How many epicycles to show
let speed = 0.02;           // Animation speed

// UI Elements
let circleSlider;
let speedSlider;

function setup() {
  createCanvas(800, 600);
  frameRate(60);

  circleLabel = createP("Number of Circles: ");
  circleLabel.position(20, height - 50);

  circleSlider = createSlider(1, 200, 150, 1);
  circleSlider.position(20, height - 5);
  circleSlider.style('width', '200px');
  
  speedLabel = createP("Animation Speed:");
  speedLabel.position(20, height + 25);

  speedSlider = createSlider(0.005, 0.05, 0.02, 0.005);
  speedSlider.position(20, height + 70);
  speedSlider.style('width', '200px');

  console.log("Phase 1: Mouse Drawing Mode");
  console.log("Instructions:");
  console.log("  - Click and drag to draw");
  console.log("  - Release to compute Fourier transform");
  console.log("  - Press 'c' to clear");
  console.log("  - Press '1' for circle preset");
  console.log("  - Press '2' for square preset");
  console.log("  - Use sliders to adjust circles and speed");
}

function draw() {
  // Read slider values
  numCircles = circleSlider.value();
  speed = speedSlider.value();
  
  background(26, 26, 26);

// If no drawing yet --> display instruction text
if (!hasDrawing && !isDrawing) {
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(24);
    text("Draw a shape with your mouse!", width / 2, height / 2 - 40);
    textSize(16);
    text("Click and drag to draw", width / 2, height / 2);
    text("'1' circle, '2' square, '3' heart, '4' signature", width / 2, height / 2 + 30);
    text("Press 's' to save your drawing as signature", width / 2, height / 2 + 55);
  }
  translate(width / 2, height / 2); // Moves (0,0) to center instead of top left corner
  
  // Draw axes
  stroke(50);
  strokeWeight(1);
  line(-width/2, 0, width/2, 0);
  line(0, -height/2, 0, height/2);
  
  // Show and create vertecies of the drawing in progress
  if (isDrawing && userPoints.length > 0) {
    stroke(100, 200, 255);
    strokeWeight(3);
    noFill();
    beginShape();
    for (let point of userPoints) {
      vertex(point.re, point.im);
    }
    endShape(); // Creates a custom shape
  }
  
  // Show resampled points
  if (resampledPoints.length > 0 && !isDrawing) {
    // Draw resampled points as small dots
    fill(255, 255, 0, 100);
    noStroke();
    for (let point of resampledPoints) {
      circle(point.re, point.im, 3);
    }
  }
  
  // Animate epicycles if we have a drawing
  if (hasDrawing && fourierComponents.length > 0) {
    // Draw epicycles
    let endpoint = drawEpicycles(0, 0, time, numCircles);
    
    // Add to path
    path.unshift({ x: endpoint.x, y: endpoint.y });
    if (path.length > 500) {
      path.pop();
    }
    
    // Draw traced path
    stroke(255, 100, 100);
    strokeWeight(3);
    noFill();
    beginShape();
    for (let point of path) {
      vertex(point.x, point.y);
    }
    endShape();
    
    // Draw current position dot
    fill(255, 50, 50);
    noStroke();
    circle(endpoint.x, endpoint.y, 8);
    
    time += speed;
  }
  
  // Draw UI info
  drawUI();
}

// ============================================
// MOUSE INTERACTION
// ============================================

function mousePressed() {
  // Only start drawing if inside canvas
  if (mouseX > 0 && mouseX < width && mouseY > 0 && mouseY < height) {
    isDrawing = true;
    userPoints = [];
    hasDrawing = false;
    
    // Add first point (centered coordinate system)
    userPoints.push({
      re: mouseX - width / 2,
      im: mouseY - height / 2
    });
  }
}

function mouseDragged() {
  if (isDrawing) {
    // Add point (centered coordinate system)
    let x = mouseX - width / 2;
    let y = mouseY - height / 2;
    
    // Only add if it's far enough from last point (reduces redundant points)
    let lastPoint = userPoints[userPoints.length - 1];
    let distance = dist(x, y, lastPoint.re, lastPoint.im);
    
    if (distance > 5) {  // Minimum 5 pixels between points
      userPoints.push({ re: x, im: y });
    }
  }
}

function mouseReleased() {
  if (isDrawing && userPoints.length > 10) {
    isDrawing = false;
    
    console.log("\n=== Drawing Complete ===");
    console.log("Raw points collected:", userPoints.length);
    
    // Step 1: Close the path (connect end to start)
    closePath();
    
    // Step 2: Resample to get evenly spaced points
    resampledPoints = resamplePath(userPoints, 300);  // Target 300 points
    console.log("Resampled points:", resampledPoints.length);
    
    // Step 3: Center the drawing
    centerPoints();
    
    // Step 4: Compute Fourier transform
    fourierComponents = dft(resampledPoints);
    
    // Step 5: Show top frequencies
    let sorted = [...fourierComponents].sort((a, b) => b.amp - a.amp);
    console.log("Top 5 frequency components:");
    for (let i = 0; i < 5; i++) {
      console.log(`  Frequency ${sorted[i].freq}: amplitude = ${sorted[i].amp.toFixed(2)}`);
    }
    
    hasDrawing = true;
    time = 0;
    path = [];
  } else if (isDrawing) {
    // Drawing too short, cancel it
    isDrawing = false;
    userPoints = [];
  }
}

// ============================================
// KEYBOARD CONTROLS
// ============================================

function keyPressed() {
  if (key === 'c' || key === 'C') {
    // Clear drawing
    userPoints = [];
    resampledPoints = [];
    fourierComponents = [];
    path = [];
    hasDrawing = false;
    time = 0;
    console.log("Drawing cleared");
  } else if (key === '1') {
    // Circle preset
    loadCirclePreset();
  } else if (key === '2') {
    // Square preset
    loadSquarePreset();
  } else if (key === '3') {
    // Heart preset - NEW!
    loadHeartPreset();
  } else if (key === '4') {
    // Signature preset - THIS NEEDS TO BE HERE
    loadSignaturePreset();
  } else if (key === 's' || key === 'S') {
    // Save current drawing as signature - NEW!
    saveAsSignature();
  }
}

// ============================================
// POINT PROCESSING
// ============================================

function closePath() {
  // Connect last point to first point with interpolated points
  let first = userPoints[0];
  let last = userPoints[userPoints.length - 1];
  let distance = dist(first.re, first.im, last.re, last.im);
  
  // If endpoints are far apart, interpolate between them
  if (distance > 10) {
    let steps = Math.floor(distance / 5);
    for (let i = 1; i <= steps; i++) {
      let t = i / (steps + 1);
      userPoints.push({
        re: lerp(last.re, first.re, t), // Linear Interpolation - value between two numbers (last and first) based on percentage (t)
        im: lerp(last.im, first.im, t)
      });
    }
  }
}

// Spreads out the points on the shape into targetCount amount that are equally spaced
function resamplePath(points, targetCount) {
  if (points.length < 2) return points;
  
  // Calculate total path length
  let totalLength = 0;
  for (let i = 1; i < points.length; i++) {
    let d = dist(points[i].re, points[i].im, points[i-1].re, points[i-1].im);
    totalLength += d;
  }
  
  // Target spacing between points that is equal
  let spacing = totalLength / targetCount;
  
  let resampled = [];
  resampled.push(points[0]);  // Always include first point
  
  let accumulatedDist = 0;
  let targetDist = spacing;
  
  for (let i = 1; i < points.length; i++) {
    let prevPoint = points[i - 1];
    let currPoint = points[i];
    let segmentLength = dist(currPoint.re, currPoint.im, prevPoint.re, prevPoint.im);
    
    accumulatedDist += segmentLength;
    
    // Add points along this segment if needed
    while (accumulatedDist >= targetDist && resampled.length < targetCount) {
      // How far along this segment should the new point be?
      let overshoot = accumulatedDist - targetDist;
      let ratio = 1 - (overshoot / segmentLength);
      
      resampled.push({
        re: lerp(prevPoint.re, currPoint.re, ratio),
        im: lerp(prevPoint.im, currPoint.im, ratio)
      });
      
      targetDist += spacing;
    }
  }
  
  // Ensure we have exactly targetCount points by keep adding the last point 
  while (resampled.length < targetCount) {
    resampled.push(points[points.length - 1]);
  }
  
  return resampled.slice(0, targetCount);
}

function centerPoints() {
  // Find centroid
  let sumX = 0;
  let sumY = 0;
  for (let point of resampledPoints) {
    sumX += point.re;
    sumY += point.im;
  }
  let centerX = sumX / resampledPoints.length;
  let centerY = sumY / resampledPoints.length;
  
  // Translate all points
  for (let point of resampledPoints) {
    point.re -= centerX;
    point.im -= centerY;
  }
  
  console.log(`Centered drawing (offset: ${centerX.toFixed(1)}, ${centerY.toFixed(1)})`);
}

// ============================================
// PRESETS
// ============================================

function loadCirclePreset() {
  console.log("\n=== Loading Circle Preset ===");
  const numPoints = 100;
  const radius = 150;
  
  resampledPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = (i / numPoints) * TWO_PI;
    resampledPoints.push({
      re: cos(angle) * radius,
      im: sin(angle) * radius
    });
  }
  
  fourierComponents = dft(resampledPoints);
  hasDrawing = true;
  time = 0;
  path = [];
  
  let sorted = [...fourierComponents].sort((a, b) => b.amp - a.amp);
  console.log("Top 5 frequency components:");
  for (let i = 0; i < 5; i++) {
    console.log(`  Frequency ${sorted[i].freq}: amplitude = ${sorted[i].amp.toFixed(2)}`);
  }
}

function loadSquarePreset() {
  console.log("\n=== Loading Square Preset ===");
  const numPoints = 200;
  const size = 150;
  
  resampledPoints = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / numPoints;
    let x, y;
    
    if (t < 0.25) {
      x = map(t, 0, 0.25, -size, size);
      y = -size;
    } else if (t < 0.5) {
      x = size;
      y = map(t, 0.25, 0.5, -size, size);
    } else if (t < 0.75) {
      x = map(t, 0.5, 0.75, size, -size);
      y = size;
    } else {
      x = -size;
      y = map(t, 0.75, 1, size, -size);
    }
    
    resampledPoints.push({ re: x, im: y });
  }
  
  fourierComponents = dft(resampledPoints);
  hasDrawing = true;
  time = 0;
  path = [];
  
  let sorted = [...fourierComponents].sort((a, b) => b.amp - a.amp);
  console.log("Top 5 frequency components:");
  for (let i = 0; i < 5; i++) {
    console.log(`  Frequency ${sorted[i].freq}: amplitude = ${sorted[i].amp.toFixed(2)}`);
  }
}

function loadHeartPreset() {
    console.log("\n=== Loading Heart Preset ===");
    const numPoints = 200;
    const scale = 8;  // Size of the heart
    
    resampledPoints = [];
    for (let i = 0; i < numPoints; i++) {
      const t = (i / numPoints) * TWO_PI;
      
      // Parametric heart equation
      // x = 16sin³(t)
      // y = 13cos(t) - 5cos(2t) - 2cos(3t) - cos(4t)
      let x = 16 * pow(sin(t), 3);
      let y = 13 * cos(t) - 5 * cos(2 * t) - 2 * cos(3 * t) - cos(4 * t);
      
      // Flip vertically (hearts point down in math, we want up)
      y = -y;
      
      resampledPoints.push({ 
        re: x * scale, 
        im: y * scale 
      });
    }
    
    fourierComponents = dft(resampledPoints);
    hasDrawing = true;
    time = 0;
    path = [];
    
    let sorted = [...fourierComponents].sort((a, b) => b.amp - a.amp);
    console.log("Top 5 frequency components:");
    for (let i = 0; i < 5; i++) {
      console.log(`  Frequency ${sorted[i].freq}: amplitude = ${sorted[i].amp.toFixed(2)}`);
    }
  }

  function saveAsSignature() {
    if (resampledPoints.length > 0) {
      console.log("\n=== Saving Signature ===");
      console.log("Copy this array and paste it into loadSignaturePreset():");
      console.log("\nconst signatureData = [");
      
      // Print in a format you can copy-paste
      for (let i = 0; i < resampledPoints.length; i++) {
        let point = resampledPoints[i];
        console.log(`  {re: ${point.re.toFixed(2)}, im: ${point.im.toFixed(2)}},`);
      }
      console.log("];");
      console.log("\nCopy everything between the [ ] brackets!");
    } else {
      console.log("Draw something first, then press 's' to save!");
    }
  }

  function loadSignaturePreset() {
    console.log("\n=== Loading Signature Preset ===");
    
    const signatureData = [
    {re: -11.10, im: -66.03},
    {re: -16.35, im: -71.59},
    {re: -21.65, im: -77.07},
    {re: -27.63, im: -81.85},
    {re: -34.27, im: -85.61},
    {re: -41.31, im: -88.63},
    {re: -48.08, im: -92.21},
    {re: -55.03, im: -95.34},
    {re: -62.50, im: -96.93},
    {re: -69.65, im: -99.65},
    {re: -76.97, im: -101.80},
    {re: -84.29, im: -104.03},
    {re: -91.95, im: -104.15},
    {re: -99.55, im: -105.03},
    {re: -107.21, im: -105.03},
    {re: -114.87, im: -105.03},
    {re: -122.54, im: -105.03},
    {re: -130.20, im: -105.03},
    {re: -137.86, im: -105.03},
    {re: -145.52, im: -105.03},
    {re: -153.19, im: -105.03},
    {re: -160.83, im: -104.78},
    {re: -168.40, im: -103.57},
    {re: -175.75, im: -101.47},
    {re: -182.90, im: -98.71},
    {re: -190.01, im: -95.86},
    {re: -197.24, im: -93.31},
    {re: -204.00, im: -89.84},
    {re: -211.34, im: -87.73},
    {re: -218.26, im: -84.45},
    {re: -225.43, im: -81.80},
    {re: -231.76, im: -77.49},
    {re: -237.74, im: -72.71},
    {re: -243.48, im: -67.64},
    {re: -249.30, im: -62.67},
    {re: -253.60, im: -56.40},
    {re: -257.86, im: -50.11},
    {re: -260.81, im: -43.03},
    {re: -263.73, im: -35.95},
    {re: -266.16, im: -28.69},
    {re: -267.10, im: -21.12},
    {re: -267.10, im: -13.46},
    {re: -267.10, im: -5.79},
    {re: -266.95, im: 1.86},
    {re: -265.18, im: 9.27},
    {re: -262.33, im: 16.39},
    {re: -259.25, im: 23.39},
    {re: -255.31, im: 29.96},
    {re: -249.95, im: 35.29},
    {re: -243.41, im: 39.25},
    {re: -236.12, im: 41.47},
    {re: -228.50, im: 41.97},
    {re: -220.84, im: 41.97},
    {re: -213.17, im: 41.97},
    {re: -205.55, im: 41.55},
    {re: -198.14, im: 39.66},
    {re: -190.94, im: 37.04},
    {re: -183.71, im: 34.51},
    {re: -176.92, im: 31.02},
    {re: -169.94, im: 27.89},
    {re: -163.04, im: 24.55},
    {re: -156.43, im: 20.84},
    {re: -150.45, im: 16.06},
    {re: -144.02, im: 11.91},
    {re: -138.13, im: 7.00},
    {re: -132.09, im: 2.30},
    {re: -126.17, im: -2.41},
    {re: -121.60, im: -8.52},
    {re: -116.81, im: -14.46},
    {re: -112.24, im: -20.60},
    {re: -106.54, im: -25.67},
    {re: -101.08, im: -31.04},
    {re: -95.51, im: -36.29},
    {re: -89.53, im: -41.08},
    {re: -83.20, im: -45.37},
    {re: -77.11, im: -50.01},
    {re: -70.16, im: -53.19},
    {re: -63.09, im: -55.83},
    {re: -55.85, im: -58.23},
    {re: -48.30, im: -59.58},
    {re: -40.68, im: -60.03},
    {re: -33.02, im: -60.03},
    {re: -25.36, im: -60.03},
    {re: -23.93, im: -58.14},
    {re: -30.47, im: -54.15},
    {re: -37.23, im: -50.57},
    {re: -44.35, im: -47.73},
    {re: -51.05, im: -44.05},
    {re: -58.09, im: -41.03},
    {re: -59.15, im: -37.84},
    {re: -51.64, im: -37.03},
    {re: -43.98, im: -37.03},
    {re: -44.76, im: -30.80},
    {re: -52.03, im: -28.38},
    {re: -59.24, im: -25.84},
    {re: -66.79, im: -24.58},
    {re: -74.28, im: -22.98},
    {re: -81.56, im: -20.64},
    {re: -89.05, im: -19.18},
    {re: -83.73, im: -17.29},
    {re: -76.27, im: -15.55},
    {re: -68.67, im: -14.66},
    {re: -61.04, im: -14.01},
    {re: -53.57, im: -12.29},
    {re: -46.07, im: -10.74},
    {re: -38.49, im: -9.59},
    {re: -30.92, im: -8.43},
    {re: -26.58, im: -3.46},
    {re: -31.14, im: 1.50},
    {re: -37.54, im: 5.69},
    {re: -44.39, im: 9.12},
    {re: -51.24, im: 12.55},
    {re: -58.55, im: 14.82},
    {re: -65.75, im: 17.39},
    {re: -73.20, im: 19.19},
    {re: -74.22, im: 17.67},
    {re: -67.86, im: 13.43},
    {re: -60.79, im: 10.49},
    {re: -53.64, im: 7.75},
    {re: -46.78, im: 4.32},
    {re: -39.64, im: 1.55},
    {re: -32.72, im: -1.71},
    {re: -25.74, im: -4.84},
    {re: -19.47, im: -9.21},
    {re: -13.38, im: -13.84},
    {re: -6.91, im: -17.94},
    {re: -0.39, im: -21.97},
    {re: 5.77, im: -26.49},
    {re: 11.71, im: -31.32},
    {re: 17.88, im: -35.86},
    {re: 23.70, im: -40.85},
    {re: 29.51, im: -45.84},
    {re: 35.03, im: -51.15},
    {re: 40.45, im: -56.57},
    {re: 46.28, im: -61.45},
    {re: 53.42, im: -63.93},
    {re: 60.94, im: -65.37},
    {re: 68.33, im: -67.03},
    {re: 75.78, im: -65.73},
    {re: 83.23, im: -63.98},
    {re: 90.78, im: -62.73},
    {re: 98.12, im: -60.58},
    {re: 105.70, im: -59.49},
    {re: 113.20, im: -58.08},
    {re: 120.57, im: -55.98},
    {re: 127.94, im: -53.87},
    {re: 135.31, im: -51.77},
    {re: 142.51, im: -49.18},
    {re: 149.68, im: -46.48},
    {re: 156.94, im: -44.02},
    {re: 164.32, im: -41.95},
    {re: 171.86, im: -40.58},
    {re: 179.43, im: -39.46},
    {re: 187.07, im: -39.03},
    {re: 194.73, im: -39.03},
    {re: 201.53, im: -37.90},
    {re: 194.26, im: -35.48},
    {re: 186.92, im: -33.28},
    {re: 179.49, im: -31.42},
    {re: 172.12, im: -29.36},
    {re: 164.91, im: -26.78},
    {re: 157.48, im: -24.89},
    {re: 150.21, im: -22.46},
    {re: 142.72, im: -20.90},
    {re: 135.19, im: -19.48},
    {re: 127.69, im: -17.95},
    {re: 120.37, im: -15.72},
    {re: 112.85, im: -14.22},
    {re: 105.62, im: -11.77},
    {re: 98.08, im: -10.39},
    {re: 91.23, im: -7.22},
    {re: 87.80, im: -5.03},
    {re: 95.47, im: -5.03},
    {re: 103.13, im: -5.03},
    {re: 110.75, im: -5.58},
    {re: 118.37, im: -6.43},
    {re: 126.00, im: -7.03},
    {re: 133.63, im: -7.37},
    {re: 141.23, im: -8.03},
    {re: 148.89, im: -8.03},
    {re: 156.55, im: -8.03},
    {re: 164.22, im: -8.03},
    {re: 158.02, im: -7.03},
    {re: 150.36, im: -7.03},
    {re: 142.70, im: -7.03},
    {re: 135.11, im: -6.27},
    {re: 128.48, im: -2.60},
    {re: 123.06, im: 2.82},
    {re: 117.24, im: 7.75},
    {re: 111.13, im: 12.35},
    {re: 105.13, im: 17.08},
    {re: 98.66, im: 21.19},
    {re: 92.84, im: 26.17},
    {re: 86.63, im: 30.66},
    {re: 80.57, im: 35.31},
    {re: 75.15, im: 40.73},
    {re: 68.15, im: 43.79},
    {re: 61.29, im: 47.12},
    {re: 55.01, im: 51.51},
    {re: 48.57, im: 55.64},
    {re: 42.13, im: 59.73},
    {re: 35.21, im: 62.99},
    {re: 28.73, im: 67.09},
    {re: 21.72, im: 69.81},
    {re: 14.99, im: 73.37},
    {re: 7.92, im: 76.33},
    {re: 0.72, im: 78.95},
    {re: -6.52, im: 81.45},
    {re: -13.77, im: 83.93},
    {re: -20.99, im: 86.51},
    {re: -28.13, im: 89.27},
    {re: -35.37, im: 91.68},
    {re: -42.86, im: 93.28},
    {re: -50.27, im: 95.23},
    {re: -57.64, im: 97.28},
    {re: -64.94, im: 99.51},
    {re: -72.33, im: 101.53},
    {re: -78.54, im: 102.49},
    {re: -72.72, im: 97.51},
    {re: -66.17, im: 93.58},
    {re: -59.18, im: 90.45},
    {re: -52.52, im: 86.65},
    {re: -45.85, im: 82.90},
    {re: -38.51, im: 80.70},
    {re: -31.68, im: 77.33},
    {re: -25.29, im: 73.10},
    {re: -17.96, im: 70.91},
    {re: -11.11, im: 67.48},
    {re: -4.25, im: 64.05},
    {re: 2.73, im: 60.91},
    {re: 9.50, im: 57.35},
    {re: 16.06, im: 53.38},
    {re: 22.78, im: 49.74},
    {re: 29.34, im: 45.94},
    {re: 35.27, im: 41.08},
    {re: 40.65, im: 35.68},
    {re: 46.14, im: 30.39},
    {re: 52.05, im: 25.52},
    {re: 58.89, im: 22.31},
    {re: 66.11, im: 19.97},
    {re: 72.93, im: 22.00},
    {re: 78.35, im: 27.42},
    {re: 83.18, im: 33.35},
    {re: 88.12, im: 39.19},
    {re: 93.24, im: 44.81},
    {re: 96.81, im: 51.51},
    {re: 101.45, im: 57.61},
    {re: 106.43, im: 63.43},
    {re: 111.65, im: 69.02},
    {re: 116.15, im: 75.22},
    {re: 121.57, im: 80.64},
    {re: 126.99, im: 86.06},
    {re: 133.15, im: 90.52},
    {re: 138.97, im: 95.48},
    {re: 145.11, im: 99.92},
    {re: 152.25, im: 102.68},
    {re: 159.59, im: 104.88},
    {re: 167.02, im: 106.75},
    {re: 174.46, im: 108.61},
    {re: 181.76, im: 110.93},
    {re: 189.33, im: 111.97},
    {re: 196.99, im: 111.97},
    {re: 204.66, im: 111.97},
    {re: 212.32, im: 111.97},
    {re: 209.13, im: 108.20},
    {re: 203.12, im: 103.45},
    {re: 197.12, im: 98.69},
    {re: 191.11, im: 93.94},
    {re: 185.10, im: 89.19},
    {re: 179.09, im: 84.43},
    {re: 173.08, im: 79.68},
    {re: 167.07, im: 74.92},
    {re: 161.06, im: 70.17},
    {re: 155.05, im: 65.41},
    {re: 149.04, im: 60.66},
    {re: 143.03, im: 55.90},
    {re: 137.02, im: 51.15},
    {re: 131.01, im: 46.40},
    {re: 125.00, im: 41.64},
    {re: 118.99, im: 36.89},
    {re: 112.98, im: 32.13},
    {re: 106.97, im: 27.38},
    {re: 100.96, im: 22.62},
    {re: 94.95, im: 17.87},
    {re: 88.94, im: 13.11},
    {re: 82.93, im: 8.36},
    {re: 76.92, im: 3.61},
    {re: 70.91, im: -1.15},
    {re: 64.90, im: -5.90},
    {re: 58.89, im: -10.66},
    {re: 52.88, im: -15.41},
    {re: 46.87, im: -20.17},
    {re: 40.86, im: -24.92},
    {re: 34.85, im: -29.68},
    {re: 28.84, im: -34.43},
    {re: 22.83, im: -39.18},
    {re: 16.82, im: -43.94},
    {re: 10.81, im: -48.69},
    {re: 4.80, im: -53.45},
    {re: -1.21, im: -58.20}
    ];
    
    if (signatureData.length === 0) {
      console.log("No signature saved yet! Draw your signature and press 's' to save it.");
      return;
    }
    
    resampledPoints = signatureData;
    fourierComponents = dft(resampledPoints);
    hasDrawing = true;
    time = 0;
    path = [];
    
    let sorted = [...fourierComponents].sort((a, b) => b.amp - a.amp);
    console.log("Top 5 frequency components:");
    for (let i = 0; i < 5; i++) {
      console.log(`  Frequency ${sorted[i].freq}: amplitude = ${sorted[i].amp.toFixed(2)}`);
    }
  }

// ============================================
// DFT
// ============================================

function dft(points) {
    const N = points.length;
    const components = [];
    
    for (let k = 0; k < N; k++) {
      let re = 0;
      let im = 0;
      
      for (let n = 0; n < N; n++) {
        const angle = k * TWO_PI * n / N;
        re += points[n].re * cos(angle) + points[n].im * sin(angle);
        im += -points[n].re * sin(angle) + points[n].im * cos(angle);
      }
      
      re = re / N;
      im = im / N;
      
      let amp = sqrt(re * re + im * im);
      let phase = atan2(im, re);
      
      // CRITICAL FIX: Remap frequencies so they're centered around 0
      // Instead of 0, 1, 2, ... N-1
      // We want: -N/2, ..., -1, 0, 1, ..., N/2
      let freq = k;
      if (k > N / 2) {
        freq = k - N;  // Map high frequencies to negative
      }
      
      components.push({ re, im, freq, amp, phase });
    }
    
    return components;
  }

// ============================================
// EPICYCLE DRAWING
// ============================================

function drawEpicycles(x, y, rotation, maxCircles) {
  let currentX = x;
  let currentY = y;
  
  // STEP 1: Sort by amplitude to find the most important frequencies
  let sortedByAmp = [...fourierComponents].sort((a, b) => b.amp - a.amp);
  
  // STEP 2: Take only the top maxCircles
  let topComponents = sortedByAmp.slice(0, maxCircles);
  
  // STEP 3: Re-sort by frequency for correct reconstruction
  let sorted = topComponents.sort((a, b) => a.freq - b.freq);
  
  for (let i = 0; i < sorted.length; i++) {
    let prevX = currentX;
    let prevY = currentY;
    
    let freq = sorted[i].freq;
    let radius = sorted[i].amp;
    let phase = sorted[i].phase;
    let angle = freq * rotation + phase;
    
    // Draw circle if radius is significant
    if (radius > 1) {
      noFill();
      stroke(255, 255, 255, 30);
      strokeWeight(1);
      circle(prevX, prevY, radius * 2);
      
      // Draw rotating vector
      stroke(255, 255, 255, 100);
      strokeWeight(1);
      line(prevX, prevY, prevX + radius * cos(angle), prevY + radius * sin(angle));
    }
    
    currentX += radius * cos(angle);
    currentY += radius * sin(angle);
  }
  
  return { x: currentX, y: currentY };
}

// ============================================
// UI
// ============================================

function drawUI() {
  push();
  resetMatrix();
  
  fill(255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(14);
  
  text(`Circles: ${numCircles}`, 10, 10);
  text(`Speed: ${speed.toFixed(3)}`, 10, 30);
  text(`Points: ${resampledPoints.length}`, 10, 50);
  
    // Slider labels
//   textAlign(LEFT, TOP);
//   text('Number of Circles:', 10, height - 10);
//   text('Animation Speed:', 10, height - 50);
  
  textAlign(RIGHT, TOP);
  text("Press 'c' to clear", width - 10, 10);
  text("'1' circle, '2' square, '3' heart, '4' signature", width - 10, 30);
  text("Press 's' to save signature", width - 10, 50);
  
  pop();
}