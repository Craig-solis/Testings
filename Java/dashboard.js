// dashboard.js - User dashboard logic

import { auth } from "../Java/firebase-config.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";

const db = getFirestore();

onAuthStateChanged(auth, async (user) => {
  if (user) {
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const role = userDoc.data().role;
      if (role === "admin" || role === "user" || role === "approved") {
        // Show main dashboard
        document.body.style.display = "block";
        const loader = document.getElementById("loader");
        const content = document.getElementById("content");
        if (loader) loader.style.display = "none";
        if (content) content.style.display = "block";
        setupNavbar(); // Attach navbar logic after content is visible
        setupSignOut(); // Attach signout logic after content is visible
      } else {
        // Show awaiting approval screen
        document.body.style.display = "none";
        alert("Your account is pending admin approval.");
        await signOut(auth);
        window.location.href = "login.html";
      }
    } else {
      alert("User document does not exist.");
      await signOut(auth);
      window.location.href = "login.html";
    }
  } else {
    window.location.href = "login.html";
  }
});

//NavBar ----------------------------------------------------
function setupNavbar() {
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
}

//Signout Logic
function setupSignOut() {
    const signOutBtn = document.getElementById("signOutBtn");
    if (signOutBtn) {
        signOutBtn.addEventListener("click", async () => {
            await signOut(auth);
            window.location.href = "../index.html";
        });
    }
}