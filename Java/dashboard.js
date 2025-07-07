import { auth } from './firebase-config.js'; // Adjust path if needed
import {
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  signOut
} from 'https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js';

//NavBar ----------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // Navbar logic
    const navbarToggle = document.querySelector('.navbar-toggle');
    const navbarMenu = document.querySelector('.navbar-menu');
    const navbar = document.querySelector('.navbar');

    if (navbarToggle && navbarMenu) {
        navbarToggle.addEventListener('click', (e) => {
            e.stopPropagation();
            navbarToggle.classList.toggle('active');
            navbarMenu.classList.toggle('active');
        });

        document.addEventListener('click', (e) => {
            if (
                navbarMenu.classList.contains('active') &&
                !navbar.contains(e.target)
            ) {
                navbarToggle.classList.remove('active');
                navbarMenu.classList.remove('active');
            }
        });
    }

    window.addEventListener('scroll', function() {
        if (window.scrollY > 0) {
            navbar.classList.add('solid');
        } else {
            navbar.classList.remove('solid');
        }
    });

    // --- Idle Timeout Logic Setup ---
    let idleTimeout;
    const IDLE_LIMIT = 30 * 60 * 1000; // 30 minutes

    function resetIdleTimer() {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
            signOut(auth).then(() => {
                alert("You have been logged out due to inactivity.");
                window.location.href = "../login.html";
            });
        }, IDLE_LIMIT);
    }

    // Add event listeners ONCE
    ['mousemove', 'keydown', 'mousedown', 'touchstart'].forEach(event => {
        document.addEventListener(event, resetIdleTimer, false);
    });

    // Set session persistence-----------------------------------
    setPersistence(auth, browserSessionPersistence)
        .then(() => {
            onAuthStateChanged(auth, user => {
                console.log("Auth state:", user); // Optional debug line

                const loader = document.getElementById("loader");
                const content = document.getElementById("content");

                if (user) {
                    if (loader) loader.style.display = "none";
                    document.body.style.display = "block";
                    if (content) content.style.display = "block";
                    resetIdleTimer(); // Start inactivity timer
                } else {
                    window.location.href = "../login.html";
                }
                });
        })
        .catch(error => {
            console.error("Session persistence setup failed:", error);
        });
});