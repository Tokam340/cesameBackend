import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const register = async (req, res) => {
  try {
    const { firstname, lastname, email, country, city, phone, password } = req.body;

    // ✅ Validation
    if (!firstname || !lastname || !email || !country || !city || !password) {
      return res.status(400).json({
        success: false,
        message: "Tous les champs obligatoires doivent être remplis",
      });
    }

    // ✅ Vérifier email existant
    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "Cet email est déjà utilisé",
      });
    }

    // ✅ Vérifier téléphone (si fourni)
    if (phone) {
      const existingPhone = await User.findOne({ phone });
      if (existingPhone) {
        return res.status(400).json({
          success: false,
          message: "Ce numéro est déjà utilisé",
        });
      }
    }

    // ✅ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ Création utilisateur
    const newUser = await User.create({
      firstname,
      lastname,
      email,
      country,
      city,
      phone,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "Inscription réussie ✅",
      user: {
        id: newUser._id,
        firstname: newUser.firstname,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Erreur serveur",
      console.log(err);
    });
  }
};


export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // ✅ Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email et mot de passe requis",
      });
    }

    // ✅ Vérifier utilisateur
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Email incorrect",
      });
    }

    // ✅ Vérifier password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Mot de passe incorrect",
      });
    }

    // ✅ Générer token
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Connexion réussie ✅",
      token,
      user: {
        id: user._id,
        firstname: user.firstname,
        email: user.email,
        phone: user.phone,
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
