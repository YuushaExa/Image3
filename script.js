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

        const weights = [];
        let weightSum = 0;

        // Collect edge pixels for blending with weights based on distance from center
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < length; i += 4) {
            const dx = (i / 4) % (radius * 2) - radius;
            const dy = Math.floor((i / 4) / (radius * 2)) - radius;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= radius - 1 && distance <= radius) {
                const weight = 1 / distance; // Inverse distance weighting
                weights.push({ index: i, weight: weight });
                r += data[i] * weight;
                g += data[i + 1] * weight;
                b += data[i + 2] * weight;
                weightSum += weight;
                count++;
            }
        }

        r = Math.floor(r / weightSum);
        g = Math.floor(g / weightSum);
        b = Math.floor(b / weightSum);

        // Gaussian blur kernel for smoothing
        const kernel = [0.0625, 0.125, 0.0625, 0.125, 0.25, 0.125, 0.0625, 0.125, 0.0625];
        const kernelSize = 3;
        const halfKernel = Math.floor(kernelSize / 2);

        for (let i = 0; i < length; i += 4) {
            const dx = (i / 4) % (radius * 2) - radius;
            const dy = Math.floor((i / 4) / (radius * 2)) - radius;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance <= radius) {
                let red = 0, green = 0, blue = 0, alpha = 0, kernelSum = 0;

                for (let ky = -halfKernel; ky <= halfKernel; ky++) {
                    for (let kx = -halfKernel; kx <= halfKernel; kx++) {
                        const kernelValue = kernel[(ky + halfKernel) * kernelSize + (kx + halfKernel)];
                        const offsetX = dx + kx;
                        const offsetY = dy + ky;
                        if (offsetX >= -radius && offsetX <= radius && offsetY >= -radius && offsetY <= radius) {
                            const index = 4 * ((offsetY + radius) * (radius * 2) + (offsetX + radius));
                            if (index >= 0 && index < data.length) {
                                red += data[index] * kernelValue;
                                green += data[index + 1] * kernelValue;
                                blue += data[index + 2] * kernelValue;
                                alpha += data[index + 3] * kernelValue;
                                kernelSum += kernelValue;
                            }
                        }
                    }
                }

                data[i] = (red / kernelSum + r) / 2;
                data[i + 1] = (green / kernelSum + g) / 2;
                data[i + 2] = (blue / kernelSum + b) / 2;
                data[i + 3] = alpha / kernelSum;
            }
        }

        context.putImageData(imageData, Math.max(0, x - radius), Math.max(0, y - radius));
    }
});
