
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
  },

  payments: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Payment",
    },
  ],
});

export default mongoose.model("users", userSchema);
