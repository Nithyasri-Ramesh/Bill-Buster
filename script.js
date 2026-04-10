// REPLACE WITH YOUR FIREBASE CONFIG
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "your-app.firebaseapp.com",
    projectId: "your-project-id",
    appId: "your-app-id"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

const video = document.getElementById('webcam');
const startBtn = document.getElementById('start-btn');
const resultsArea = document.getElementById('results');
const itemName = document.getElementById('item-name');
const itemCost = document.getElementById('item-cost');
const historyModal = document.getElementById('history-modal');
const historyList = document.getElementById('history-list');

let model = undefined;
let isDetecting = false;
let currentUser = null;

// 1. Sign In Anonymously on Load
auth.signInAnonymously().catch(err => console.error("Auth Error:", err));
auth.onAuthStateChanged(user => { if(user) currentUser = user; });

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
        "laptop": { w: 65, n: "Laptop" },
        "refrigerator": { w: 200, n: "Fridge" },
        "microwave": { w: 1200, n: "Microwave" },
        "airplane": { w: 75, n: "Ceiling Fan" },
        "umbrella": { w: 75, n: "Ceiling Fan" }
    };

    if (appliances[label]) {
        const item = appliances[label];
        const costStr = ((item.w / 1000) * 7).toFixed(2);

        resultsArea.classList.remove('hidden');
        itemName.innerText = item.n;
        itemCost.innerText = `₹${costStr} / hour`;

        if (currentUser) saveToDB(item.n, costStr);
    }
}

async function saveToDB(name, cost) {
    await db.collection("scans").add({
        uid: currentUser.uid, // This makes it private
        device: name,
        cost: cost,
        time: firebase.firestore.FieldValue.serverTimestamp()
    });
}

document.getElementById('view-history').addEventListener('click', async () => {
    if(!currentUser) return;
    historyModal.classList.remove('hidden');
    historyList.innerHTML = "<li>Loading...</li>";
    
    // Filter by YOUR uid only
    const snapshot = await db.collection("scans")
        .where("uid", "==", currentUser.uid)
        .orderBy("time", "desc").limit(10).get();
        
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