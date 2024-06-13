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
        const targetArea = context.getImageData(x - radius, y - radius, radius * 2, radius * 2);

        const bestPatch = findBestPatch(targetArea, x, y, radius);
        context.putImageData(bestPatch, x - radius, y - radius);
    }

    function findBestPatch(targetArea, centerX, centerY, radius) {
        const searchRadius = radius * 2;
        let bestPatch = null;
        let bestPatchError = Infinity;

        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
            for (let dx = -searchRadius; dx <= searchRadius; dx++) {
                const patchX = centerX + dx - radius;
                const patchY = centerY + dy - radius;

                if (patchX < 0 || patchY < 0 || patchX + radius * 2 >= canvas.width || patchY + radius * 2 >= canvas.height) {
                    continue;
                }

                const patch = context.getImageData(patchX, patchY, radius * 2, radius * 2);
                const patchError = calculatePatchError(targetArea, patch);

                if (patchError < bestPatchError) {
                    bestPatchError = patchError;
                    bestPatch = patch;
                }
            }
        }

        return bestPatch;
    }

    function calculatePatchError(targetArea, patch) {
        const targetData = targetArea.data;
        const patchData = patch.data;
        let error = 0;

        for (let i = 0; i < targetData.length; i += 4) {
            const dr = targetData[i] - patchData[i];
            const dg = targetData[i + 1] - patchData[i + 1];
            const db = targetData[i + 2] - patchData[i + 2];
            error += dr * dr + dg * dg + db * db;
        }

        return error;
    }
});
