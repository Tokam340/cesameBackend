// import { body } from 'express-validator';

// export const validateRegistration = [
//   body('email').isEmail().withMessage('Email invalide'),
//   body('password').isLength({ min: 6 }).withMessage('Le mot de passe doit faire au moins 6 caractères'),
// ];

// export const validateLogin = [
//   body('email').isEmail(),
//   body('password').notEmpty(),
// ];


import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Non autorisé" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Token invalide" });
  }
};
