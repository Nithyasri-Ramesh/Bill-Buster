/**
 * BILL-BUSTER: POINT. SCAN. SAVE.
 * Real-time Energy Auditor Logic
 */

const video = document.getElementById('webcam');
const statusText = document.getElementById('status');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');
const resultsArea = document.getElementById('results');

let model = undefined;
let isProcessing = false;

// 1. Initialize the AI Brain (COCO-SSD)
async function initBillBuster() {
    try {
        statusText.innerText = "Buster is waking up...";
        // Load the pre-trained object detection model
        model = await cocoSsd.load();
        statusText.innerText = "AI Ready! Point at an appliance.";
        startCamera();
    } catch (error) {
        statusText.innerText = "Error: Camera access denied.";
        console.error("Initialization failed:", error);
    }
}

// 2. Setup Camera with Mobile Optimization
async function startCamera() {
    const constraints = {
        video: { 
            facingMode: "environment",
            width: { ideal: 640 }, // Lower res = Faster AI processing
            height: { ideal: 480 } 
        },
        audio: false
    };

    try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        video.srcObject = stream;
        video.onloadedmetadata = () => {
            video.play();
            scanFrame(); // Start the scanning loop
        };
    } catch (err) {
        statusText.innerText = "Webcam not found or blocked.";
    }
}

// 3. The Scanning Loop (Throttled for Speed)
async function scanFrame() {
    // Only run if the model is ready and we aren't already busy processing a frame
    if (model && !isProcessing) {
        isProcessing = true;
        
        const predictions = await model.detect(video);
        
        // Find the best match with over 60% confidence
        const bestMatch = predictions.find(p => p.score > 0.60);
        
        if (bestMatch) {
            calculateAndDisplay(bestMatch.class);
        }
        
        isProcessing = false;
    }
    
    // SLOW DOWN: We scan every 600ms to prevent the phone from overheating
    setTimeout(() => {
        requestAnimationFrame(scanFrame);
    }, 600);
}

// 4. Indian Energy Calculation Logic
function calculateAndDisplay(foundObject) {
    // Energy Database (Avg Wattage for Indian Homes)
    const applianceDB = {
        "tv": { watts: 120, hours: 6, label: "Television" },
        "laptop": { watts: 65, hours: 8, label: "Laptop" },
        "refrigerator": { watts: 250, hours: 24, label: "Refrigerator" },
        "microwave": { watts: 1200, hours: 0.5, label: "Microwave Oven" },
        "cell phone": { watts: 10, hours: 4, label: "Mobile Charger" },
        "oven": { watts: 2000, hours: 1, label: "Electric Oven" },
        "toaster": { watts: 800, hours: 0.2, label: "Toaster" }
    };

    const ratePerUnit = 7; // Average ₹7 per kWh in India

    if (applianceDB[foundObject]) {
        const item = applianceDB[foundObject];
        
        // Formula: (Watts * Hours / 1000) = Units (kWh)
        const dailyKwh = (item.watts * item.hours) / 1000;
        const monthlyUnits = dailyKwh * 30;
        const monthlyCost = Math.round(monthlyUnits * ratePerUnit);

        // Update UI
        resultsArea.classList.remove('hidden');
        itemName.innerText = `TARGET: ${item.label.toUpperCase()}`;
        itemCost.innerText = `₹${monthlyCost} / month`;
        
        // Optional: Change status to show detection
        statusText.innerText = "Appliance Busted!";
    }
}

// Kick off the app
initBillBuster();