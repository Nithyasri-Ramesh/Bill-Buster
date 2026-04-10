const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');
const resultsArea = document.getElementById('results');

let model = undefined;

// 1. Load the AI Model
async function loadModel() {
    statusText.innerText = "Loading AI Brain...";
    model = await cocoSsd.load();
    statusText.innerText = "AI Ready! Point at an appliance.";
    startScanner();
}

// 2. Start the Video Stream
async function startScanner() {
    const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }, // Use back camera
        audio: false
    });
    video.srcObject = stream;
    video.addEventListener('loadeddata', predictLoop);
}

// 3. The Recognition Loop
async function predictLoop() {
    const predictions = await model.detect(video);
    
    if (predictions.length > 0) {
        const topResult = predictions[0].class;
        updateHUD(topResult);
    }

    // Keep the loop running
    window.requestAnimationFrame(predictLoop);
}

// 4. The "Buster" Calculation
function updateHUD(objectFound) {
    // Basic energy lookup table
    const energyData = {
        "tv": { watts: 150, hours: 5 },
        "laptop": { watts: 60, hours: 8 },
        "refrigerator": { watts: 200, hours: 24 },
        "oven": { watts: 2400, hours: 1 },
        "microwave": { watts: 1000, hours: 0.5 }
    };

    if (energyData[objectFound]) {
        const data = energyData[objectFound];
        const kwhPerDay = (data.watts * data.hours) / 1000;
        const costPerMonth = (kwhPerDay * 30 * 0.28).toFixed(2); // Avg $0.28/kWh

        resultsArea.classList.remove('hidden');
        itemName.innerText = objectFound.toUpperCase();
        itemCost.innerText = `$${costPerMonth} / mo`;
    }
}

// Start the app
loadModel();