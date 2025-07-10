/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import { setGlobalOptions } from "firebase-functions";
import { Request, Response } from "express";
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({ maxInstances: 10 });

exports.deleteUserAuth = functions.https.onRequest(async (req: Request, res: Response) => {
  // Allow only POST
  if (req.method !== "POST") {
    res.status(405).send("Method Not Allowed");
    return;
  }
  const { uid } = req.body;
  if (!uid) {
    res.status(400).json({ error: "Missing uid" });
    return;
  }
  try {
    await admin.auth().deleteUser(uid);
    res.json({ success: true });
    return;
  } catch (err) {
    if (err instanceof Error) {
      res.status(500).json({ error: err.message, stack: err.stack });
    } else {
      res.status(500).json({ error: "Unknown error" });
    }
    return;
  }
});
