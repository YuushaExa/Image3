const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const upload = document.getElementById('upload');
const healingSpotButton = document.getElementById('healingSpotButton');
let img = new Image();
let isHealingSpotActive = false;
let healingRadius = 10;

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
    ctx.arc(x, y, healingRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'red';
    ctx.stroke();
}

function healSpot(x, y) {
    const imageData = ctx.getImageData(x - healingRadius, y - healingRadius, healingRadius * 2, healingRadius * 2);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        // Simple bilinear interpolation
        const r = (data[i] + data[i + 4] + data[i + imageData.width * 4] + data[i + imageData.width * 4 + 4]) / 4;
        const g = (data[i + 1] + data[i + 5] + data[i + imageData.width * 4 + 1] + data[i + imageData.width * 4 + 5]) / 4;
        const b = (data[i + 2] + data[i + 6] + data[i + imageData.width * 4 + 2] + data[i + imageData.width * 4 + 6]) / 4;

        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
    }

    ctx.putImageData(imageData, x - healingRadius, y - healingRadius);
}
