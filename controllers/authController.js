import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// 🔥 calcul fin abonnement
const getEndDate = (plan) => {
  const now = new Date();

  switch (plan) {
    case "2weeks":
      return new Date(now.setDate(now.getDate() + 14));
    case "1month":
      return new Date(now.setMonth(now.getMonth() + 1));
    case "2month":
      return new Date(now.setMonth(now.getMonth() + 2));
    case "3months":
      return new Date(now.setMonth(now.getMonth() + 3));
    default:
      return null;
  }
};

// ================= REGISTER =================
export const register = async (req, res) => {
  try {
    const {
      firstname,
      lastname,
      email,
      country,
      city,
      phone,
      password,
      delay
    } = req.body;

    if (!firstname || !lastname || !email || !country || !city || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Ce numéro est déjà utilisé",
        });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    let plan = "free";
    if (delay === "2 semaines") plan = "2weeks";
    if (delay === "1 mois") plan = "1month";
    if (delay === "2 mois") plan = "2month";
    if (delay === "3 mois") plan = "3months";

    const startDate = plan !== "free" ? new Date() : null;
    const endDate = plan !== "free" ? getEndDate(plan) : null;

    const newUser = await User.create({
      firstname,
      lastname,
      email,
      country,
      city,
      phone,
      password: hashedPassword,

      isActive: true,

      subscription: {
        plan,
        startDate,
        endDate,
        isActive: plan !== "free"
      },

      sessions: [] // 🔥 important
    });

    return res.status(201).json({
      success: true,
      message: "Inscription réussie ✅",
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        email: newUser.email,
        subscription: newUser.subscription
      },
    });

  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// ================= LOGIN =================
export const login = async (req, res) => {
  try {
    const { email, password, deviceType } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email incorrect",
      });
    }

    // 🔴 compte désactivé
    if (!user.subscription?.isActive) {
      return res.status(403).json({
        success: false,
        message: "Compte désactivé ❌",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe incorrect",
      });
    }

    // 🔥 vérifier expiration abonnement
    if (user.subscription?.endDate) {
      const now = new Date();

      if (now > user.subscription.endDate) {
        user.subscription.isActive = false;
        user.subscription.plan = "free";
      }
    }

    // 🔐 créer token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    await user.save();

    return res.json({
      success: true,
      message: "Connexion réussie ✅",
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        email: user.email,
        phone: user.phone,
        subscription: user.subscription,
        isActive: user.isActive
      },
    });

  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
    });
  }
};

// ================= LOGOUT =================
export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.status(400).json({ message: "Token manquant" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);

    user.sessions = user.sessions.filter(s => s.token !== token);

    await user.save();

    res.json({ message: "Déconnexion réussie" });

  } catch (err) {
    res.status(500).json({ message: "Erreur logout" });
  }
};

// ================= ADMIN =================
export const desactivateUser = async (req, res) => {
  const { userId } = req.body;

  await User.findByIdAndUpdate(userId, { isActive: false });

  res.json({ message: "Utilisateur désactivé" });
};

export const activateUser = async (req, res) => {
  const { userId } = req.body;

  await User.findByIdAndUpdate(userId, { isActive: true });

  res.json({ message: "Utilisateur activé" });
};
