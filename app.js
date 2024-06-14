const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const upload = document.getElementById('upload');
const healingSpotButton = document.getElementById('healingSpotButton');
const radiusRange = document.getElementById('radiusRange');
const radiusValue = document.getElementById('radiusValue');
let img = new Image();
let isHealingSpotActive = false;
let healingRadius = parseInt(radiusRange.value);

// Handle image upload
upload.addEventListener('change', (event) => {
    const file = event.target.files[0];
    const reader = new FileReader();
    
    reader.onload = (e) => {
        img.src = e.target.result;
        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
        }
    };
    reader.readAsDataURL(file);
});

// Activate healing spot tool
healingSpotButton.addEventListener('click', () => {
    isHealingSpotActive = !isHealingSpotActive;
    healingSpotButton.textContent = isHealingSpotActive ? 'Deactivate Healing Spot Tool' : 'Activate Healing Spot Tool';
});

// Adjust healing radius
radiusRange.addEventListener('input', () => {
    healingRadius = parseInt(radiusRange.value);
    radiusValue.textContent = healingRadius;
});

// Handle canvas mouse events
canvas.addEventListener('mousemove', (event) => {
    if (isHealingSpotActive) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        drawCursor(x, y);
    }
});

canvas.addEventListener('click', (event) => {
    if (isHealingSpotActive) {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        healSpot(x, y);
    }
});

function drawCursor(x, y) {
    ctx.drawImage(img, 0, 0);
    ctx.beginPath();
    ctx.arc(x, y, healingRadius, 0, 2 * 3.14);
    ctx.strokeStyle = 'red';
    ctx.stroke();
}

function healSpot(x, y) {
    const imageData = ctx.getImageData(x - healingRadius, y - healingRadius, healingRadius * 2, healingRadius * 2);
    const data = imageData.data;

    // Perform Poisson image editing
    const resultData = poissonEditing(data, healingRadius * 2, healingRadius * 2);

    // Apply healed data to the canvas
    for (let i = 0; i < data.length; i++) {
        data[i] = resultData[i];
    }

    ctx.putImageData(imageData, x - healingRadius, y - healingRadius);
}

function poissonEditing(data, width, height) {
    // Simplified Poisson image editing algorithm
    const result = new Uint8ClampedArray(data.length);
    
    // Copy original data to result
    result.set(data);

    for (let iter = 0; iter < 50; iter++) { // Number of iterations
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                
                for (let c = 0; c < 3; c++) { // RGB channels
                    const colorSum =
                        data[idx - 4 + c] + // left
                        data[idx + 4 + c] + // right
                        data[idx - width * 4 + c] + // top
                        data[idx + width * 4 + c]; // bottom

                    result[idx + c] = (colorSum + 4 * data[idx + c]) / 8;
                }
                result[idx + 3] = data[idx + 3]; // Preserve alpha channel
            }
        }
    }

    return result;
}
