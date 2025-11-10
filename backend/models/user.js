/**
 * Mongoose Schema for all Users (Admin and Applicant).
 * Handles registration, login, and secure password hashing using bcrypt.
 * Role-based authorization is managed by the 'role' field.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        minlength: 3
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    // The role determines privileges in the application
    /*role: {
        type: String,
        enum: ['admin', 'applicant'], // Only these two roles are allowed
        default: 'applicant' // Default role for standard sign-ups
    },*/
    // For applicants, they might have a name associated with their application
});

// Middleware to hash the password BEFORE saving the User document
UserSchema.pre('save', async function(next) {
    if (!this.isModified('password')) {
        return next();
    }
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

// Method to compare the input password with the stored hashed password
UserSchema.methods.comparePassword = async function(candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', UserSchema);
export default User;