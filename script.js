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
            let model = null;

            async function loadModel() {
                model = await tf.loadGraphModel('path/to/your/model.json'); // Use a pre-trained inpainting model
            }

            loadModel();

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

            async function inpaintSpot(x, y) {
                if (!model) {
                    alert("Model not loaded yet. Please wait.");
                    return;
                }

                const radius = cursorSize / 2;
                const imageData = context.getImageData(x - radius, y - radius, radius * 2, radius * 2);
                const tensor = tf.browser.fromPixels(imageData).toFloat().div(tf.scalar(255.0)).expandDims();
                const result = await model.predict(tensor).squeeze().mul(tf.scalar(255.0)).clipByValue(0, 255).toInt();

                const outputData = new ImageData(new Uint8ClampedArray(await result.data()), radius * 2, radius * 2);
                context.putImageData(outputData, x - radius, y - radius);
            }
        });
