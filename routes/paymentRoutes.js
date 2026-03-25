import express from "express";
import NotchPay from "notchpay.js";
import Payment from "../models/Payment.js";
import User from "../models/User.js";
import {protect} from '../middleware/validate.js';

const router = express.Router();

// Initialisation NotchPay avec la clé depuis .env
const notchpay = NotchPay("pk_test.b1N6iMQkkuE3BJW2gp8Vf10UGiYqPQyct6Qn54mnhKBNWbvIaDb2hsIDmLEqsIJjHOpUgRnzG9LzatWV5bBda1R9fRvE1q9YYcepQDeCTjx5vcc09DfNfdMMg6Pae");

/* =========================================================
   1) CREER UN PAIEMENT
========================================================= */
router.post("/create-payment", protect, async (req, res) => {
  try {
    const { amount, email, name, phone } = req.body;

    if (!amount || !email || !name) {
      return res.status(400).json({
        success: false,
        message: "amount, email et name sont obligatoires",
      });
    }

    // 🔥 1. Trouver ou créer utilisateur
    let user = await User.findOne({ email });

    if (!user) {
      user = await User.create({
        username: name,
        email,
        phone: phone || "",
        password: "default123", // ⚠️ à améliorer (hash)
        country: "unknown",
        city: "unknown",
      });
    }

    const reference = `order_${Date.now()}`;

    // 🔥 2. Appel NotchPay
    const payment = await notchpay.payments.initializePayment({
      amount: parseInt(amount),
      currency: "XAF",
      customer: { email, name, phone },
      reference,
      callback: `${process.env.BASE_URL}/api/payment-callback`,
      channels: ["mobile_money", "card"],
    });

    const paymentUrl =
      payment?.authorization_url ||
      payment?.transaction?.authorization_url ||
      payment?.data?.authorization_url ||
      "";

    // 🔥 3. Sauvegarde paiement AVEC USER
    const newPayment = await Payment.create({
      user: user._id,
      reference,
      amount,
      currency: "XAF",
      email,
      name,
      status: "pending",
      paymentUrl,
      rawResponse: payment,
    });

    return res.json({
      success: true,
      paymentUrl,
      reference,
    });
  } catch (error) {
    console.error("❌ create-payment:", error);
    res.status(500).json({ message: error.message });
  }

  console.log("User connecté:", req.user.id);
});

/* =========================================================
   2) CALLBACK APRES PAIEMENT
========================================================= */
router.get("/payment-callback", async (req, res) => {
  try {
    const { reference } = req.query;

    const paymentData = await notchpay.payments.retrieve(reference);

    const status =
      paymentData?.transaction?.status ||
      paymentData?.status ||
      "pending";

    const ref =
      paymentData?.transaction?.reference ||
      paymentData?.reference ||
      reference;

    const transactionId =
      paymentData?.transaction?.id ||
      paymentData?.id ||
      "";

    // 🔥 Trouver paiement
    const payment = await Payment.findOne({ reference: ref });

    if (!payment) {
      return res.send("Paiement introuvable");
    }

    // 🔥 Update paiement
    payment.status = status;
    payment.transactionId = transactionId;
    payment.rawResponse = paymentData;

    if (status === "complete") {
      payment.paidAt = new Date();

      // 🔥 ACTIVER USER
      await User.findByIdAndUpdate(payment.user, {
        isPremium: true,
        premiumExpires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
      });
    }

    await payment.save();

    if (status === "complete") {
      return res.redirect(
        `${process.env.FRONTEND_URL}/success`
      );
    } else {
      return res.redirect(
        `${process.env.FRONTEND_URL}/failed`
      );
    }
  } catch (error) {
    console.error("❌ callback:", error);
    res.send("Erreur paiement");
  }
});

/* =========================================================
   3) VERIFIER MANUELLEMENT UN PAIEMENT
========================================================= */
router.get("/verify-payment/:reference", async (req, res) => {
  try {
    const { reference } = req.params;

    if (!reference) {
      return res.status(400).json({
        success: false,
        message: "Référence manquante",
      });
    }

    const paymentData = await notchpay.payments.retrieve(reference);

    const status =
      paymentData?.transaction?.status ||
      paymentData?.status ||
      "pending";

    const ref =
      paymentData?.transaction?.reference ||
      paymentData?.reference ||
      reference;

    const transactionId =
      paymentData?.transaction?.id ||
      paymentData?.id ||
      "";

    const updateData = {
      status,
      notchpayResponse: paymentData,
      transactionId,
    };

    if (status === "complete") {
      updateData.paidAt = new Date();
    }

    const updatedPayment = await Payment.findOneAndUpdate(
      { reference: ref },
      updateData,
      { new: true }
    );

    return res.status(200).json({
      success: true,
      message: "Paiement vérifié",
      payment: paymentData,
      dbPayment: updatedPayment,
    });
  } catch (error) {
    console.error("❌ Erreur verify-payment :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la vérification",
      error: error.message,
    });
  }
});

/* =========================================================
   4) WEBHOOK NOTCHPAY
========================================================= */
router.post("/webhooks/notchpay", async (req, res) => {
  try {
    const event = req.body;

    res.status(200).send("OK");

    const reference =
      event?.data?.reference ||
      event?.data?.transaction?.reference;

    if (!reference) return;

    const payment = await Payment.findOne({ reference });

    if (!payment) return;

    let status = "pending";

    if (event.type === "payment.complete") status = "complete";
    if (event.type === "payment.failed") status = "failed";

    payment.status = status;
    payment.rawResponse = event;

    if (status === "complete") {
      payment.paidAt = new Date();

      // 🔥 activer user
      await User.findByIdAndUpdate(payment.user, {
        isPremium: true,
      });
    }

    await payment.save();
  } catch (err) {
    console.error("webhook error", err);
  }
});

/* =========================================================
   5) RECUPERER TOUS LES PAIEMENTS
========================================================= */
router.get("/payments", async (req, res) => {
  const payments = await Payment.find()
    .populate("user", "username email")
    .sort({ createdAt: -1 });

  res.json(payments);
});

/* =========================================================
   6) RECUPERER UN PAIEMENT PAR REFERENCE
========================================================= */
router.get("/payments/:reference", async (req, res) => {
  try {
    const payment = await Payment.findOne({ reference: req.params.reference });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Paiement introuvable",
      });
    }

    return res.status(200).json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("❌ Erreur get payment by reference :", error);

    return res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération du paiement",
      error: error.message,
    });
  }
});

export default router;