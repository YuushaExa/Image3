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
        const imageData = context.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        const length = data.length;

        // Collect edge pixels for blending
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < length; i += 4) {
            const dx = (i / 4) % (radius * 2) - radius;
            const dy = Math.floor((i / 4) / (radius * 2)) - radius;
            if (Math.sqrt(dx * dx + dy * dy) >= radius - 1) {
                r += data[i];
                g += data[i + 1];
                b += data[i + 2];
                count++;
            }
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        for (let i = 0; i < length; i += 4) {
            data[i] = (data[i] + r) / 2;
            data[i + 1] = (data[i + 1] + g) / 2;
            data[i + 2] = (data[i + 2] + b) / 2;
        }

        context.putImageData(imageData, x - radius, y - radius);
    }
});
