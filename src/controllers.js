const { loginSchema } = require('./schema/authSchema'); // Import the login schema
const { signInWithEmailAndPassword } = require('firebase/auth'); // Import function to sign in 
const { auth } = require('./firebase'); // import auth function from firebase.js
const jwt = require('jsonwebtoken');

const loginUser = async (req, res) => {
  try {
    // Validate input using JOI from schema
    const { error, value } = loginSchema.validate(req.body, {
      abortEarly: false, // Get all validation errors
      stripUnknown: true // Remove unknown fields
    });

    // Handle validation errors - ADD RETURN HERE
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Extract validated data - ONLY runs if validation passes
    const { email, password } = value;

    // Use firebase authentication
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Generate JWT token
    const token = jwt.sign(
      {
        uid: user.uid,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: '24h'
      }
    );

    // Success response
    return res.status(201).json({
      success: true,
      message: 'Login successful',
      data: {
        token: token,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        }
      }
    });

  } catch (error) {
    // Check if it's a Firebase error
    if (error.code && error.code.startsWith('auth/')) {
      let errorMessage = 'Authentication failed';
      
      switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'No user found with this email';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Incorrect password';
        break;
      case 'auth/user-disabled':
        errorMessage = 'This account has been disabled';
        break;
      case 'auth/too-many-requests':
        errorMessage = 'Too many failed attempts. Please try again later';
        break;
      default:
        errorMessage = 'Authentication failed';
      } 
      return res.status(401).json({
        success: false,
        message: errorMessage
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        debug: error.message
      });
    }
  }
};

const registeruser = async (req, res) => {

};
module.exports = { loginUser };