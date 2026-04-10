const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');
const resultsArea = document.getElementById('results');

let model = undefined;
let isProcessing = false;

// 1. Initialize the AI Brain
async function init() {
    try {
        statusText.innerText = "Buster is waking up...";
        model = await cocoSsd.load();
        statusText.innerText = "AI Ready! Point at an appliance.";
        startCamera();
    } catch (error) {
        statusText.innerText = "Error: Check camera permissions.";
        console.error(error);
    }
}

// 2. Optimized Camera Setup
async function startCamera() {
    const constraints = {
        video: { 
            facingMode: "environment",
            width: { ideal: 640 }, // Lower resolution = much faster AI
            height: { ideal: 480 } 
        },
        audio: false
    };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = stream;
    video.onloadedmetadata = () => {
        video.play();
        scanLoop();
    };
}

// 3. The "Lightweight" Scan Loop
async function scanLoop() {
    if (model && !isProcessing) {
        isProcessing = true;
        
        const predictions = await model.detect(video);
        
        // Only care about high-confidence matches (> 60%)
        const bestMatch = predictions.find(p => p.score > 0.60);
        
        if (bestMatch) {
            updateBusterUI(bestMatch.class);
        }
        
        isProcessing = false;
    }
    
    // Scan every 600ms (balanced for speed vs battery)
    setTimeout(() => {
        requestAnimationFrame(scanLoop);
    }, 600);
}

// 4. Rupee Calculation Logic
function updateBusterUI(foundObject) {
    // Average Wattage & usage hours in Indian households
    const applianceDB = {
        "tv": { watts: 120, hours: 6 },
        "laptop": { watts: 65, hours: 8 },
        "refrigerator": { watts: 250, hours: 24 },
        "microwave": { watts: 1200, hours: 0.5 },
        "cell phone": { watts: 10, hours: 4 },
        "oven": { watts: 2000, hours: 1 },
        "toaster": { watts: 800, hours: 0.2 }
    };

    const ratePerUnit = 7; // Average ₹7 per kWh

    if (applianceDB[foundObject]) {
        const item = applianceDB[foundObject];
        const dailyKwh = (item.watts * item.hours) / 1000;
        const monthlyCost = Math.round(dailyKwh * 30 * ratePerUnit);

        resultsArea.classList.remove('hidden');
        itemName.innerText = `TARGET: ${foundObject.toUpperCase()}`;
        itemCost.innerText = `₹${monthlyCost} / month`;
    }
}

init();