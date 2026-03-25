import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users", // ⚠️ doit matcher ton model
      required: true,
    },

    reference: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },

    transactionId: {
      type: String,
      default: null,
      sparse: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    currency: {
      type: String,
      default: "XAF",
    },

    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: ["pending", "complete", "failed", "cancelled"],
      default: "pending",
    },

    provider: {
      type: String,
      default: "NotchPay",
    },

    paymentUrl: {
      type: String,
      default: null,
    },

    rawResponse: {
      type: Object,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payment", paymentSchema);