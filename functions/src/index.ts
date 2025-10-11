/**
 * Import function triggers from their respective submodules:
 *
 * import {onCall} from "firebase-functions/v2/https";
 * import {onDocumentWritten} from "firebase-functions/v2/firestore";
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

import {setGlobalOptions} from "firebase-functions";
import {onDocumentCreated} from "firebase-functions/v2/firestore";
import * as logger from "firebase-functions/logger";
import * as admin from "firebase-admin";
import Twilio from "twilio";

// Start writing functions
// https://firebase.google.com/docs/functions/typescript

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

admin.initializeApp();

const twilioSid = process.env.TWILIO_SID;
const twilioToken = process.env.TWILIO_TOKEN;
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER;

let cachedTwilioClient: Twilio.Twilio | null = null;

const getTwilioClient = (): Twilio.Twilio | null => {
  if (!twilioSid || !twilioToken) {
    logger.error("Twilio SID/TOKEN environment variables are not set. OTPs cannot be sent.");
    return null;
  }

  if (!cachedTwilioClient) {
    cachedTwilioClient = Twilio(twilioSid, twilioToken);
  }

  return cachedTwilioClient;
};

export const sendQuizOtp = onDocumentCreated(
  {
    region: "asia-south1",
    document: "quiz-otp-requests/{requestId}",
  },
  async (event) => {
    const snap = event.data;
    const payload = snap?.data();

    if (!snap || !payload) {
      logger.warn("OTP request fired with no payload.");
      return;
    }

    const otp: string = (payload.otp ?? "").toString().trim();
    const mobile: string = (payload.mobile ?? "").toString().trim();

    if (!otp || !mobile) {
      logger.warn("OTP request missing mobile or otp fields.", payload);
      return;
    }

    if (!twilioFromNumber) {
      logger.error("Twilio sender phone number is not configured (TWILIO_FROM_NUMBER).");
      return;
    }

    const twilioClient = getTwilioClient();
    if (!twilioClient) {
      return;
    }

    try {
      const toNumber = mobile.startsWith("+") ? mobile : `+91${mobile}`;

      await twilioClient.messages.create({
        to: toNumber,
        from: twilioFromNumber,
        body: `Your CivicCentre IAS OTP is ${otp}. It expires in 5 minutes.`,
      });

      await snap.ref.set(
        {
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
          expireAt: admin.firestore.Timestamp.fromMillis(Date.now() + 5 * 60 * 1000),
        },
        { merge: true },
      );

      logger.info("OTP sent successfully", { to: toNumber });
    } catch (error) {
      logger.error("Failed to send OTP via Twilio", error);
      throw error;
    }
  },
);
