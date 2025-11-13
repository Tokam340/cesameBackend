// import {DataTypes} from 'sequelize';
// import {sequelize} from '../config/db.js';

// export const User = sequelize.define('User', {
//   email: {
//     type: DataTypes.STRING,
//     allowNull: false,
//     unique: true,
//     validate: { isEmail: true },
//   },
//   password: {
//     type: DataTypes.STRING,
//     allowNull: false,
//   },
//   isVerified: {
//     type: DataTypes.BOOLEAN,
//     defaultValue: false,
//   },
//   verificationToken: {
//     type: DataTypes.STRING,
//   },
// }, { timestamps: true });




import mongoose  from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },

  country: {
    type: String,
    required: true,
    lowercase: true
  },

  city: {
    type: String,
    required: true,
    lowercase: true
  },
  
  phone: {
    type: String,
    unique: true,
    lowercase: true
  },
  
  password: {
    type: String,
    required: true
  }
});

export default mongoose.model("users", userSchema);
