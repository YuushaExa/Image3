function onOpenCVReady() {
    console.log('OpenCV.js is ready');

    document.addEventListener("DOMContentLoaded", () => {
        const imageInput = document.getElementById("imageInput");
        const healingToolBtn = document.getElementById("healingToolBtn");
        const canvas = document.getElementById("imageCanvas");
        const ctx = canvas.getContext("2d");
        let img = new Image();
        let healingActive = false;

        // Load image onto canvas
        imageInput.addEventListener("change", (event) => {
            const file = event.target.files[0];
            const reader = new FileReader();
            reader.onload = (e) => {
                img.src = e.target.result;
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                };
            };
            reader.readAsDataURL(file);
        });

        // Activate healing tool
        healingToolBtn.addEventListener("click", () => {
            healingActive = !healingActive;
            canvas.style.cursor = healingActive ? "crosshair" : "default";
        });

        // Healing process
        canvas.addEventListener("click", (event) => {
            if (!healingActive) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const radius = 15;

            try {
                // Check if OpenCV.js is fully loaded
                if (!cv || !cv.inpaint) {
                    throw new Error("OpenCV.js is not loaded or the inpaint function is not available.");
                }

                // Get the selected area
                let src = cv.imread(canvas);
                let mask = new cv.Mat.zeros(src.rows, src.cols, cv.CV_8UC1);
                cv.circle(mask, new cv.Point(x, y), radius, new cv.Scalar(255), -1);

                // Inpainting
                let dst = new cv.Mat();
                cv.inpaint(src, mask, dst, 3, cv.INPAINT_TELEA);

                // Update canvas
                cv.imshow('imageCanvas', dst);

                // Clean up
                src.delete();
                mask.delete();
                dst.delete();
            } catch (error) {
                console.error("An error occurred during the inpainting process:", error);
            }
        });

        // Custom cursor effect
        canvas.addEventListener("mousemove", (event) => {
            if (!healingActive) return;

            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;
            const radius = 15;

            // Redraw image
            ctx.drawImage(img, 0, 0);

            // Draw circle cursor
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.strokeStyle = 'red';
            ctx.lineWidth = 2;
            ctx.stroke();
        });
    });
}
