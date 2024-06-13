document.addEventListener('DOMContentLoaded', () => {
    const upload = document.getElementById('upload');
    const healToolButton = document.getElementById('healToolButton');
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('2d');
    const cursor = document.getElementById('cursor');
    
    let image = new Image();
    let usingHealTool = false;

    upload.addEventListener('change', handleImageUpload);
    healToolButton.addEventListener('click', () => {
        usingHealTool = !usingHealTool;
        cursor.style.display = usingHealTool ? 'block' : 'none';
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
            cursor.style.left = `${event.clientX - cursor.offsetWidth / 2}px`;
            cursor.style.top = `${event.clientY - cursor.offsetHeight / 2}px`;
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
        const radius = 5;
        const imageData = context.getImageData(x - radius, y - radius, radius * 2, radius * 2);
        const data = imageData.data;
        const length = data.length;

        // Very basic healing logic: average color
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < length; i += 4) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
        }

        r = Math.floor(r / count);
        g = Math.floor(g / count);
        b = Math.floor(b / count);

        for (let i = 0; i < length; i += 4) {
            data[i] = r;
            data[i + 1] = g;
            data[i + 2] = b;
        }

        context.putImageData(imageData, x - radius, y - radius);
    }
});
