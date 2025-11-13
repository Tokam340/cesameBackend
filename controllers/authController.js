// import db from '../config/db.js';
// import bcrypt from 'bcryptjs';
// import jwt from'jsonwebtoken';
// import nodemailer from'nodemailer';

// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// // export const register = async (req, res) => {
// //   const { email, password } = req.body;

// //   db.query('SELECT * FROM users WHERE email = ?', [email], async (err, results) => {
// //     if (results.length > 0) return res.status(400).json({ msg: 'Email déjà utilisé' });

// //     const hashedPassword = await bcrypt.hash(password, 10);
// //     console.log('hashed password succed')
// //     const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
// //     console.log('verification token succed')

// //     db.query('INSERT INTO users (email, password, verificationToken) VALUES (?, ?, ?)',
// //       [email, hashedPassword, verificationToken],
// //       async (err) => {
// //         if (err) return res.status(500).json({ msg: 'Erreur à l\'enregistrement' });

// //         const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;
// //         await transporter.sendMail({
// //           from: process.env.EMAIL_USER,
// //           to: email,
// //           subject: 'Vérifie ton email',
// //           html: `<p>Clique ici pour vérifier ton email : <a href="${verifyUrl}">${verifyUrl}</a></p>`,
// //         });

// //         res.status(201).json({ msg: 'Inscription réussie. Vérifie ton email.' });
// //       }
// //     );
// //   });
// // };


// export const register = async (req, res) => {
//   const { email, username, phone, password } = req.body;

//   if (!email || !password) {
//     return res.status(400).json({ msg: 'Email et mot de passe requis' });
//   }

//   db.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
//     if (err) return res.status(500).json({ msg: 'Erreur lors de la vérification de l\'email' });
//     if (results.length > 0) return res.status(400).json({ msg: 'Email déjà utilisé' });
    
//     try {
//       const hashedPassword = await bcrypt.hash(password, 10);
//       const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

//       db.query('INSERT INTO user (email, username, phone, password, verificationToken, isVerified) VALUES (?, ?, ?, ?, ?, ?)',
//         [email, username, phone, hashedPassword, verificationToken, 1],
//         async (err) => {
//           //if (err) return res.status(500).json({ msg: 'Erreur à l\'enregistrement' });
//           if (err) return console.log(err);

//           const verifyUrl = `${process.env.BASE_URL}/verify-email?token=${verificationToken}`;

//           try {
//             await transporter.sendMail({
//               from: process.env.EMAIL_USER,
//               to: email,
//               subject: 'Vérifie ton email',
//               html: `<p>Clique ici pour vérifier ton email : <a href="${verifyUrl}">${verifyUrl}</a></p>`,
//             });
//             res.status(201).json({ msg: 'Inscription réussie.' });
//           } catch (emailError) {
//             res.status(500).json({ msg: 'Inscription réussie.' });
//           }
//         }
//       );
//     } catch (hashErr) {
//       res.status(500).json({ msg: 'Erreur lors du traitement de l\'inscription' });
//     }
//   });
// };


// // export const verifyEmail = (req, res) => {
// //   const { token } = req.query;

// //   try {
// //     const decoded = jwt.verify(token, process.env.JWT_SECRET);
// //     db.query('UPDATE users SET isVerified = 1, verificationToken = NULL WHERE email = ?',
// //       [decoded.email],
// //       (err, result) => {
// //         if (result.affectedRows === 0) {
// //           return res.status(400).json({ msg: 'Lien invalide ou déjà vérifié' });
// //         }
// //         res.status(200).json({ msg: 'Email vérifié avec succès' });
// //       }
// //     );
// //   } catch (err) {
// //     res.status(400).json({ msg: 'Token invalide ou expiré' });
// //   }
// // };

// export const login = (req, res) => {
//   const { email, password } = req.body;

//   db.query('SELECT * FROM user WHERE email = ?', [email], async (err, results) => {
//     if (results.length === 0) return res.status(400).json({ msg: 'Email non trouvé' });

//     const user = results[0];
//     if (!user.isVerified) return res.status(400).json({ msg: 'Email non vérifié' });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ msg: 'Mot de passe incorrect' });

//     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });
//     res.status(200).json({ msg: 'Inscription réussie', token });
//   });
// };


import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from'jsonwebtoken';

export const register = async (req, res) => {
  try {
    const { username, email, country, city, phone, password } = req.body;

    // Vérification des champs
    // if (!email || !password) {
    //   return res.status(400).json({ message: "Tous les champs sont obligatoires" });
    // }

    // Vérifie si l'utilisateur existe déjà
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Cet email est déjà utilisé" });
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(password, 10);

    // Création de l'utilisateur
    const newUser = new User({
      username,
      email,
      country,
      city,
      phone,
      password: hashedPassword
    });

    await newUser.save();

    res.status(201).json({ message: "Inscription réussie ✅" });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Vérifie si l'utilisateur existe
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email incorrect" });

    // Vérifie le mot de passe
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Mot de passe incorrect" });

    // Génération du token
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      message: "Connexion réussie ✅",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (err) {
    res.status(500).json({ message: "Erreur serveur", error: err.message });
  }
};

