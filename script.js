document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('upload');
    const healToolButton = document.getElementById('healToolButton');
    const cursorSizeInput = document.getElementById('cursorSize');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const cursor = document.getElementById('cursor');
    
    let image = new Image();
    let usingHealTool = false;
    let cursorSize = parseInt(cursorSizeInput.value, 10);

    upload.addEventListener('change', handleImageUpload);
    healToolButton.addEventListener('click', () => {
        usingHealTool = !usingHealTool;
        cursor.style.display = usingHealTool ? 'block' : 'none';
    });

    cursorSizeInput.addEventListener('input', () => {
        cursorSize = parseInt(cursorSizeInput.value, 10);
        cursor.style.width = cursor.style.height = `${cursorSize}px`;
    });

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('click', handleCanvasClick);

    function handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function (e) {
                image.onload = function () {
                    canvas.width = image.width;
                    canvas.height = image.height;
                    context.drawImage(image, 0, 0);
                }
                image.src = e.target.result;
            }
            reader.readAsDataURL(file);
        }
    }

    function handleMouseMove(event) {
        if (usingHealTool) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            cursor.style.left = `${event.clientX - cursorSize / 2}px`;
            cursor.style.top = `${event.clientY - cursorSize / 2}px`;
        }
    }

    function handleCanvasClick(event) {
        if (usingHealTool) {
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            healSpot(x, y);
        }
    }

    function healSpot(x, y) {
        const radius = cursorSize / 2;
        const imageData = context.getImageData(Math.max(0, x - radius), Math.max(0, y - radius), Math.min(radius * 2, canvas.width - x + radius), Math.min(radius * 2, canvas.height - y + radius));
        const data = imageData.data;
        const length = data.length;

        // Create an array to store pixel data for surrounding patches
        const patches = [];

        // Sample patches from surrounding area
        for (let offsetY = -radius; offsetY <= radius; offsetY += radius) {
            for (let offsetX = -radius; offsetX <= radius; offsetX += radius) {
                if (offsetX === 0 && offsetY === 0) continue; // Skip the center patch

                const patchX = Math.max(0, Math.min(canvas.width - radius * 2, x + offsetX - radius));
                const patchY = Math.max(0, Math.min(canvas.height - radius * 2, y + offsetY - radius));
                const patchData = context.getImageData(patchX, patchY, radius * 2, radius * 2);
                patches.push(patchData);
            }
        }

        // Blend the sampled patches
        const blendedData = blendPatches(patches, radius * 2, radius * 2);

        // Apply the blended patch to the selected area
        for (let i = 0; i < length; i++) {
            data[i] = blendedData[i];
        }

        context.putImageData(imageData, Math.max(0, x - radius), Math.max(0, y - radius));
    }

    function blendPatches(patches, width, height) {
        const blendedData = new Uint8ClampedArray(width * height * 4);
        const patchCount = patches.length;

        // Weights for blending, giving more importance to closer patches
        const weights = patches.map((patch, index) => {
            const dx = (index % 3) - 1; // Relative x-position in the 3x3 grid
            const dy = Math.floor(index / 3) - 1; // Relative y-position in the 3x3 grid
            const distance = Math.sqrt(dx * dx + dy * dy);
            return 1 / (distance + 0.1); // Adding a small constant to avoid division by zero
        });

        const weightSum = weights.reduce((a, b) => a + b, 0);

        for (let i = 0; i < blendedData.length; i += 4) {
            let r = 0, g = 0, b = 0, a = 0;

            for (let j = 0; j < patchCount; j++) {
                r += patches[j].data[i] * weights[j];
                g += patches[j].data[i + 1] * weights[j];
                b += patches[j].data[i + 2] * weights[j];
                a += patches[j].data[i + 3] * weights[j];
            }

            blendedData[i] = r / weightSum;
            blendedData[i + 1] = g / weightSum;
            blendedData[i + 2] = b / weightSum;
            blendedData[i + 3] = a / weightSum;
        }

        return blendedData;
    }
});
