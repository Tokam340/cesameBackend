import express from 'express';
import { register, login } from '../controllers/authController.js';
import axios from "axios";
import { v4 as uuidv4 } from "uuid";
//import { validateRegistration, validateLogin } from '../middleware/validate.js';

const router = express.Router();

router.post('/register', register);
//router.get('/verify-email', verifyEmail);
router.post('/login', login);

router.post("/mtn/init", async (req, res) => {
  const { amount, phone } = req.body;

  const transactionId = uuidv4();

  try {
    const resp = await axios.post(
      `${process.env.MTN_BASE_URL}/requesttopay`,
      {
        amount,
        currency: "XAF",
        externalId: transactionId,
        payer: {
          partyIdType: "MSISDN",
          partyId: phone,
        },
        payerMessage: "Paiement Smart TCF",
        payeeNote: "Achat",
      },
      {
        headers: {
          "X-Reference-Id": transactionId,
          "X-Target-Environment": "sandbox",
          "Ocp-Apim-Subscription-Key": process.env.MTN_PRIMARY_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    return res.json({
      status: "pending",
      transactionId,
    });
  } catch (err) {
    console.log(err.response?.data);
    res.status(500).json({ error: "Erreur MoMo" });
  }
});

router.get("/mtn/verify/:id", async (req, res) => {
  const id = req.params.id;

  try {
    const resp = await axios.get(
      `${process.env.MTN_BASE_URL}/requesttopay/${id}`,
      {
        headers: {
          "Ocp-Apim-Subscription-Key": process.env.MTN_PRIMARY_KEY,
          "X-Target-Environment": "sandbox",
        },
      }
    );

    res.json(resp.data);
  } catch (err) {
    res.status(500).json({ error: "Impossible de vérifier le paiement" });
  }
});

router.post("/mtn/webhook", (req, res) => {
  console.log("MOOV WEBHOOK:", req.body);
  res.sendStatus(200);
});

router.post("/om/webhook", (req, res) => {
  console.log("ORANGE WEBHOOK:", req.body);
  res.sendStatus(200);
});


export default router;

