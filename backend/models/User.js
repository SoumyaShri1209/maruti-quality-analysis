const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Please add a name'] },
    email: {
      type: String,
      required: [true, 'Please add an email'],
      unique: true,
      trim: true,
      match: [/.+\@.+\..+/, 'Please enter a valid email']
    },
    password: {
      type: String,
      minlength: 6,
      // password not required for Google users
      required: function () { return !this.googleId; }
    },
    googleId: { type: String, default: null },
    isVerified: { type: Boolean, default: false },
    verificationToken: String,
    verificationTokenExpires: Date,
  },
  { timestamps: true }
);

// Hash password only if modified and exists
userSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('User', userSchema);