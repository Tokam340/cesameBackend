import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // 🔹 INFOS BASIQUES
    firstname: {
      type: String,
      required: true,
      trim: true,
    },

    lastname: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    country: {
      type: String,
      required: true,
    },

    city: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
      required: true,
    },

    // 🔐 AUTH / SÉCURITÉ
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
    },

    sessions: [
      {
        token: String,
        deviceType: String,
        userAgent: String,
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ],

    // 💳 ABONNEMENT
    subscription: {
      plan: {
        type: String,
        enum: ["free", "2weeks", "1month", "3months"],
        default: "free",
      },

      startDate: {
        type: Date,
        default: null,
      },

      endDate: {
        type: Date,
        default: null,
      },

      isActive: {
        type: Boolean,
        default: false,
      },

      autoRenew: {
        type: Boolean,
        default: false,
      },
    },

    // 💰 HISTORIQUE DES PAIEMENTS (VERSION SIMPLE - OK POUR DÉBUT)
    payments: [
      {
        amount: {
          type: Number,
          required: true,
        },

        currency: {
          type: String,
          default: "XAF",
        },

        method: {
          type: String,
          enum: ["mtn_momo", "orange_money", "card"],
          required: true,
        },

        status: {
          type: String,
          enum: ["pending", "success", "failed"],
          default: "pending",
        },

        transactionId: {
          type: String,
          index: true,
        },

        plan: {
          type: String,
        },

        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    // 📊 PROGRESSION
    progress: {
      ce: { type: Number, default: 0 },
      co: { type: Number, default: 0 },
      ee: { type: Number, default: 0 },
      eo: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true, // 🔥 remplace createdAt + updatedAt automatiquement
  }
);



// 🔥 INDEX UTILES
userSchema.index({ email: 1 });
userSchema.index({ phone: 1 });

// 🔥 MÉTHODE UTILE (PRO)
userSchema.methods.isSubscriptionActive = function () {
  return (
    this.subscription.isActive &&
    this.subscription.endDate &&
    this.subscription.endDate > new Date()
  );
};

export default mongoose.model("User", userSchema);