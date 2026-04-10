// 1. Firebase Configuration (REPLACE WITH YOURS)
const firebaseConfig = {
    apiKey: "AIzaSy...",
    authDomain: "bill-buster.firebaseapp.com",
    projectId: "bill-buster",
    storageBucket: "bill-buster.appspot.com",
    messagingSenderId: "12345",
    appId: "1:12345:web:6789"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// 2. Element Selectors
const video = document.getElementById('webcam');
const startBtn = document.getElementById('start-btn');
const resultsArea = document.getElementById('results');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');

let model = undefined;
let isDetecting = false;

// 3. Logic & AI
startBtn.addEventListener('click', async () => {
    startBtn.style.display = 'none';
    await tf.setBackend('webgl');
    model = await cocoSsd.load({ base: 'mobilenet_v2' });
    setupCamera();
});

async function setupCamera() {
    const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment", width: 320, height: 240 } 
    });
    video.srcObject = stream;
    video.onloadedmetadata = () => { video.play(); requestAnimationFrame(runDetection); };
}

async function runDetection() {
    if (model && !isDetecting) {
        isDetecting = true;
        const predictions = await model.detect(video, 1, 0.4);
        if (predictions.length > 0) processResult(predictions[0].class);
        isDetecting = false;
    }
    requestAnimationFrame(runDetection);
}

function processResult(label) {
    const appliances = {
        "tv": { w: 100, n: "Smart TV" },
        "laptop": { w: 65, n: "Work Laptop" },
        "refrigerator": { w: 200, n: "Fridge (Inverter)" },
        "microwave": { w: 1200, n: "Microwave" },
        "airplane": { w: 75, n: "Ceiling Fan" },
        "umbrella": { w: 75, n: "Ceiling Fan" }
    };

    if (appliances[label]) {
        const item = appliances[label];
        const hourlyRate = (item.w / 1000) * 7;
        const costStr = hourlyRate.toFixed(2);

        resultsArea.classList.remove('hidden');
        itemName.innerText = item.n;
        itemCost.innerText = `₹${costStr} / hour`;

        // Save to Database (Cloud Firestore)
        saveToDB(item.n, costStr);
    }
}

async function saveToDB(name, cost) {
    try {
        await db.collection("scans").add({
            device: name,
            cost: cost,
            time: firebase.firestore.FieldValue.serverTimestamp()
        });
    } catch (e) { console.error(e); }
}

// 4. UI Functions
document.getElementById('view-history').addEventListener('click', async () => {
    historyList.innerHTML = "<li>Loading...</li>";
    historyModal.classList.remove('hidden');
    
    const snapshot = await db.collection("scans").orderBy("time", "desc").limit(10).get();
    historyList.innerHTML = "";
    snapshot.forEach(doc => {
        const data = doc.data();
        const li = document.createElement('li');
        li.innerHTML = `<span>${data.device}</span> <strong>₹${data.cost}</strong>`;
        historyList.appendChild(li);
    });
});

document.getElementById('close-history').addEventListener('click', () => {
    historyModal.classList.add('hidden');
});