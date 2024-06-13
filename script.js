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
                const sourcePatch = extractPatch(x, y, radius);

                const bestMatch = findBestMatch(sourcePatch, x, y, radius);
                if (bestMatch) {
                    blendPatches(sourcePatch, bestMatch, x - radius, y - radius, radius);
                }
            }

            function extractPatch(x, y, radius) {
                return context.getImageData(x - radius, y - radius, radius * 2, radius * 2);
            }

            function findBestMatch(sourcePatch, x, y, radius) {
                const searchRadius = 30;
                let bestMatch = null;
                let bestScore = Infinity;

                for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                    for (let dy = -searchRadius; dy <= searchRadius; dy++) {
                        const targetPatch = extractPatch(x + dx, y + dy, radius);
                        const score = computePatchScore(sourcePatch, targetPatch);
                        if (score < bestScore) {
                            bestScore = score;
                            bestMatch = targetPatch;
                        }
                    }
                }

                return bestMatch;
            }

            function computePatchScore(sourcePatch, targetPatch) {
                const sourceData = sourcePatch.data;
                const targetData = targetPatch.data;
                let score = 0;

                for (let i = 0; i < sourceData.length; i += 4) {
                    score += Math.abs(sourceData[i] - targetData[i])
                          + Math.abs(sourceData[i + 1] - targetData[i + 1])
                          + Math.abs(sourceData[i + 2] - targetData[i + 2]);
                }

                return score;
            }

            function blendPatches(sourcePatch, targetPatch, x, y, radius) {
                const sourceData = sourcePatch.data;
                const targetData = targetPatch.data;
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

                context.putImageData(sourcePatch, x, y);
            }
        });
