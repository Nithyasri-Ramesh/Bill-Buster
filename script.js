const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const startBtn = document.getElementById('start-btn');
const resultsArea = document.getElementById('results');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');

let model = undefined;
let isProcessing = false;

// 1. Initialize with Lite Model
startBtn.addEventListener('click', async () => {
    startBtn.style.display = 'none';
    statusText.innerText = "Optimizing AI...";
    // mobilenet_v2 is significantly faster than the default
    model = await cocoSsd.load({ base: 'mobilenet_v2' });
    statusText.innerText = "Scanning Active";
    setupCamera();
});

async function setupCamera() {
    const constraints = { 
        video: { 
            facingMode: "environment",
            width: { ideal: 640 }, // Lower resolution = much faster scanning
            height: { ideal: 480 }
        } 
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        runDetection();
    };
}

// 2. High-Performance Loop
async function runDetection() {
    if (model && !isProcessing) {
        isProcessing = true;
        
        // Only detect the top 2 items to save CPU
        const predictions = await model.detect(video, 2, 0.5);
        
        if (predictions.length > 0) {
            processResult(predictions[0].class);
        }
        
        isProcessing = false;
    }
    
    // Scan every 500ms to keep the phone cool and UI snappy
    setTimeout(() => {
        requestAnimationFrame(runDetection);
    }, 500);
}

function processResult(label) {
    const db = {
        "tv": { w: 150, h: 5, n: "Television" },
        "laptop": { w: 60, h: 8, n: "Laptop" },
        "refrigerator": { w: 250, h: 24, n: "Fridge" },
        "microwave": { w: 1000, h: 0.5, n: "Microwave" }
    };

    if (db[label]) {
        const item = db[label];
        const monthlyCost = Math.round((item.w * item.h * 30 / 1000) * 7);
        resultsArea.classList.remove('hidden');
        itemName.innerText = item.n;
        itemCost.innerText = `₹${monthlyCost} / month`;
    }
}