const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');

// Initialize Firebase Admin SDK
const serviceAccount = require('./serviceAccountKey.json'); // Download this from Firebase Console
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const app = express();
app.use(cors());
app.use(express.json());

app.post('/deleteUserAuth', async (req, res) => {
  const { uid } = req.body;
  if (!uid) {
    console.error('Request missing uid:', req.body);
    return res.status(400).json({ error: 'Missing uid' });
  }
  try {
    await admin.auth().deleteUser(uid);
    console.log(`Successfully deleted user with uid: ${uid}`);
    res.json({ success: true });
  } catch (err) {
    console.error(`Failed to delete user with uid: ${uid}`, err);
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));