import { auth } from './firebase-config.js';
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

// --- Idle Timeout Logic Setup ---
let idleTimeout;
const IDLE_LIMIT = 30 * 60 * 1000; // 30 minutes

function resetIdleTimer() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(() => {
        signOut(auth).then(() => {
            alert("You have been logged out due to inactivity.");
            window.location.href = "login.html";
        });
    }, IDLE_LIMIT);
}

// Add event listeners ONCE
['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetIdleTimer, false);
});

// Set session persistence and handle auth state
setPersistence(auth, browserSessionPersistence)
    .then(() => {
        onAuthStateChanged(auth, user => {
            const loader = document.getElementById("loader");
            const content = document.getElementById("content");

            if (user) {
                if (loader) loader.style.display = "none";
                document.body.style.display = "block";
                if (content) content.style.display = "block";
                resetIdleTimer(); // Start inactivity timer
            } else {
                window.location.href = "login.html";
            }
        });
    })
    .catch(error => {
        console.error("Session persistence setup failed:", error);
    });
