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
            let canvasData = null;

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
                            canvasData = context.getImageData(0, 0, canvas.width, canvas.height);
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
                    inpaintSpot(x, y);
                }
            }

            function inpaintSpot(x, y) {
                const radius = cursorSize / 2;
                const imageData = context.getImageData(x - radius, y - radius, radius * 2, radius * 2);
                const data = imageData.data;

                const patchSize = radius * 2;
                const similarPatch = findBestPatch(x, y, patchSize);
                if (similarPatch) {
                    inpaintPatch(data, similarPatch.data, radius);
                    context.putImageData(imageData, x - radius, y - radius);
                }
            }

            function findBestPatch(x, y, size) {
                const searchRadius = 30;
                let bestPatch = null;
                let bestScore = Infinity;

                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                        const patchData = extractPatchData(x + dx, y + dy, size);
                        const score = computePatchScore(patchData);
                        if (score < bestScore) {
                            bestScore = score;
                            bestPatch = { x: x + dx, y: y + dy, data: patchData };
                        }
                    }
                }

                return bestPatch;
            }

            function extractPatchData(x, y, size) {
                const startX = Math.max(0, x);
                const startY = Math.max(0, y);
                const endX = Math.min(canvas.width, x + size);
                const endY = Math.min(canvas.height, y + size);
                return context.getImageData(startX, startY, endX - startX, endY - startY).data;
            }

            function computePatchScore(data) {
                let r = 0, g = 0, b = 0, count = data.length / 4;
                for (let i = 0; i < data.length; i += 4) {
                    r += data[i];
                    g += data[i + 1];
                    b += data[i + 2];
                }
                r /= count;
                g /= count;
                b /= count;

                let score = 0;
                for (let i = 0; i < data.length; i += 4) {
                    score += Math.abs(data[i] - r) + Math.abs(data[i + 1] - g) + Math.abs(data[i + 2] - b);
                }

                return score;
            }

            function inpaintPatch(sourceData, targetData, radius) {
                const length = sourceData.length;

                for (let i = 0; i < length; i += 4) {
                    const dx = (i / 4) % (radius * 2) - radius;
                    const dy = Math.floor((i / 4) / (radius * 2)) - radius;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist < radius) {
                        sourceData[i] = (sourceData[i] + targetData[i]) / 2;
                        sourceData[i + 1] = (sourceData[i + 1] + targetData[i + 1]) / 2;
                        sourceData[i + 2] = (sourceData[i + 2] + targetData[i + 2]) / 2;
                    }
                }
            }
        });
