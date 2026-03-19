import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-firestore.js";

// TODO: Replace with your actual Firebase config from the console
const firebaseConfig = {
    apiKey: "AIzaSyBFjWmYPAq2PmXG4jUkeFQMGGyJHcbwW0w",
    authDomain: "jkb-restro.firebaseapp.com",
    projectId: "jkb-restro",
    storageBucket: "jkb-restro.firebasestorage.app",
    messagingSenderId: "33027075488",
    appId: "1:33027075488:web:7a911c0e18f9525db688c5"
  };

let db = null;

// The try/catch ensures the script doesn't crash if your API keys are wrong/missing
try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
} catch (error) {
    console.warn("Firebase not configured correctly yet. Functions will run, but orders won't save to the cloud.");
}

let cart = [];

// Explicitly attaching to 'window' so inline HTML events can find them
window.addItem = function(n, p) {
    let i = cart.find(x => x.n === n);
    i ? i.q++ : cart.push({n, p, q: 1});
    window.render();
};

window.qty = function(i, v) {
    cart[i].q += v;
    if(cart[i].q <= 0) cart.splice(i, 1);
    window.render();
};

window.render = function() {
    let b = document.getElementById("cartBody");
    let total = 0; 
    b.innerHTML = "";
    
    cart.forEach((i, x) => {
        let sub = i.p * i.q;
        total += sub;
        b.innerHTML += `
        <tr>
            <td>${i.n}</td>
            <td>
                <button class="qtybtn" onclick="qty(${x},-1)">−</button>
                ${i.q}
                <button class="qtybtn" onclick="qty(${x},1)">+</button>
            </td>
            <td>₹${sub}</td>
        </tr>`;
    });
    document.getElementById("totalDisplay").innerText = "₹" + total;
};

window.filterItems = function() {
    let q = document.getElementById("search").value.toLowerCase();
    document.querySelectorAll(".item").forEach(r => {
        r.style.display = r.innerText.toLowerCase().includes(q) ? "" : "none";
    });
};

window.setCat = function(c) {
    document.querySelectorAll(".item").forEach(r => {
        r.style.display = (c === "all" || r.classList.contains(c)) ? "" : "none";
    });
};

window.placeOrder = async function() {
    const name = document.getElementById("userName").value;
    const phone = document.getElementById("userPhone").value;
    const addr = document.getElementById("userAddress").value;

    if(!name || !phone || !addr || cart.length === 0){
        alert("Please provide all delivery details and add items to your cart.");
        return;
    }

    if (!db) {
        alert("Firebase is not connected yet! Please add your keys to script.js");
        return;
    }

    try {
        const btn = document.querySelector('.place');
        btn.innerText = "Processing...";
        btn.disabled = true;

        await addDoc(collection(db, "online_orders"), {
            customer: name,
            contact: phone,
            address: addr,
            items: cart,
            total: document.getElementById("totalDisplay").innerText,
            status: "New Order",
            timestamp: serverTimestamp()
        });

        alert("✅ Order Placed Successfully! We are preparing your food.");
        
        cart = []; 
        window.render();
        document.getElementById("userName").value = "";
        document.getElementById("userPhone").value = "";
        document.getElementById("userAddress").value = "";

        btn.innerText = "PLACE ORDER";
        btn.disabled = false;

    } catch (error) {
        console.error("Error adding document: ", error);
        alert("❌ Error placing order. Please check your connection and try again.");
        document.querySelector('.place').innerText = "PLACE ORDER";
        document.querySelector('.place').disabled = false;
    }
};
