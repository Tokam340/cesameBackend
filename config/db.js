// import mysql from 'mysql2';
// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASS,
//   database: process.env.DB_NAME
// });

// connection.connect((err, results) => {
//   if (err) throw err;
//   if (results) console.log("✅ Connecté à MySQL");
// });

// export default connection;


import mongoose  from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ MongoDB connecté avec succès");
  } catch (err) {
    console.error("Erreur de connexion MongoDB :", err.message);
    process.exit(1);
  }
};

export default connectDB;
