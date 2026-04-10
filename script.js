const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const startBtn = document.getElementById('start-btn');
const resultsArea = document.getElementById('results');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');

let model = undefined;

startBtn.addEventListener('click', async () => {
    startBtn.style.display = 'none';
    statusText.innerText = "Turbo-Loading...";
    // Force use of the Lite model for raw speed
    model = await cocoSsd.load({ base: 'mobilenet_v2' });
    statusText.innerText = "Hyper-Scan Active";
    setupCamera();
});

async function setupCamera() {
    const constraints = { 
        video: { 
            facingMode: "environment",
            // DOWN-SAMPLING: Smaller resolution = Instant AI detection
            width: 320, 
            height: 240 
        } 
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        runDetection();
    };
}

async function runDetection() {
    if (model) {
        // Reduced 'maxPossibilities' to 1 for the absolute fastest result
        const predictions = await model.detect(video, 1, 0.4);
        
        if (predictions.length > 0) {
            processResult(predictions[0].class);
        }
    }
    // Zero delay loop for maximum frame rate
    requestAnimationFrame(runDetection);
}

function processResult(label) {
    const db = {
        "tv": { w: 150, h: 5, n: "Television" },
        "laptop": { w: 60, h: 8, n: "Laptop" },
        "refrigerator": { w: 250, h: 24, n: "Fridge" },
        "microwave": { w: 1000, h: 0.5, n: "Microwave" },
        "cell phone": { w: 10, h: 3, n: "Phone" }
    };

    if (db[label]) {
        const item = db[label];
        const monthlyCost = Math.round((item.w * item.h * 30 / 1000) * 7);
        resultsArea.classList.remove('hidden');
        itemName.innerText = item.n;
        itemCost.innerText = `₹${monthlyCost} / month`;
    }
}