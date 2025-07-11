// signup.js - Signup page logic

import { auth } from "../Java/firebase-config.js";
import { createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

const db = getFirestore();

if (window.emailjs) {
  emailjs.init('AGk60--qzPOJcZW2G');
}

document.getElementById("signupBtn").addEventListener("click", signUp);
document.getElementById("password").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    document.getElementById("signupBtn").click();
  }
});

async function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const successMessage = document.getElementById('success-message');
  const errorMessage = document.getElementById('error-message');
  successMessage.style.display = "none";
  errorMessage.style.display = "none";

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const userRef = doc(db, "users", userCredential.user.uid);
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      const now = new Date();
      const createdDate = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
      await setDoc(userRef, {
        email: email,
        role: "pending",
        createdDate: createdDate
      });
    }
    successMessage.textContent = "Signup request sent! Await admin approval.";
    successMessage.style.display = "block";

  } catch (error) {
    errorMessage.textContent = error.message;
    errorMessage.style.display = "block";
  }
}
