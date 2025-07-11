const { loginSchema, registerSchema } = require('./schema/authSchema'); // Import the login schema
const { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, applyActionCode, signOut } = require('firebase/auth'); // Import function to sign in 
const { auth } = require('./firebase'); // import auth function from firebase.js
const jwt = require('jsonwebtoken');
require('dotenv').config();

const loginUser = async (req, res) => {
  try {
    const existingToken = req.headers.authorization?.split(' ')[1];
    if(existingToken) {
      try {
        const decoded = jwt.verify(existingToken, process.env.JWT_SECRET);

        return res.status(400).json({
          success: false,
          message: 'User is already logged in',
          data: {
            alreadyLoggedIn: true,
            currentUser: {
              uid: decoded.uid,
              email: decoded.email
            }
          }
        });
      } catch {
        console.log('Existing token is invalid, proceeding to login');
      }
    }
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
    
    if(!user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: 'Please verify your email',
        error: 'EMAIL_NOT_VERIFIED'
      });
    }
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

const verifyEmail = async (req, res) => {
  try {
    const { oobCode } = req.query; // Get verification code
      
    // Check if there is no oobCode 
    if(!oobCode) {
      return res.status(400).json({
        success: false,
        message: 'Verification code is required'
      });
    }
    
    // Apply the email verification code
    await applyActionCode(auth, oobCode);
    
    return res.status(200).json({
      success: true,
      message: 'Email verified'
    });
  } catch (error) {
    let errorMessage = 'Email verification failed';
    if(error.code) {
      switch (error.code) {
      case 'auth/expired-action-code':
        errorMessage = 'Verification link has expired';
        break;
      case 'auth/invalid-action-code':
        errorMessage = 'Invalid verification link';
        break;
      case 'auth/user-disabled':
        errorMessage = 'User account has been disabled';
        break;
      default:
        errorMessage = 'Email verification failed';
      }
      return res.status(400).json({
        success: false,
        message: errorMessage
      });
    }
  }
};

const resendVerificationEmail = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if email is not filled
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    // Extract user's JWT Token
    const token = req.headers.authorization ?.split(' ')[1];

    if(!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    // Verify JWT token to get user info
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if email in request matches the email in token
    if(decoded.email !== email) {
      return res.status(403).json({
        success: false, 
        message: 'Email does not match authenticated user'
      });
    }

    // Get current firebase user
    const user = auth.currentUser;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not authenticated'
      });
    }

    // Check if email is verified
    if(user.emailVerified) {
      return res.status(400).json({
        success: false,
        message: 'Email is already verified'
      });
    }

    // Send verification email
    await sendEmailVerification(user);

    return res.status(200).json({
      success: true,
      message: 'Verification email has been sent'
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message:'Invalid authentication token'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Failed to send verification email',
        debug: error.message
      });
    }
  }
};

const registeruser = async (req, res) => {
  try {
    // Validating input
    const { error, value } = registerSchema.validate(req.body, {
      abortEarly: false, // Get all validation errors
      stripUnknown: true // Remove unknown fields
    });

    // Handle validation errors
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Extract email, password, confirmPassword 
    const { email, password, confirmPassword } = value;

    // Check if password != confirmPassword
    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Password does not match'
      });
    }

    // Create user with Firebase
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user);
    // generate JWT token
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
      message: 'Registration successful',
      data: {
        token: token,
        user: {
          uid: user.uid,
          email: user.email,
          emailVerified: user.emailVerified
        },
        emailVerificationSent: true
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

const logoutUser = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Logout from firebase
    await signOut(auth);

    return res.status(200).json({
      success: true,
      message: 'Logout successful' ,
      data: {
        loggedOutAt: new Date().toISOString(),
        uid: decoded.uid
      }
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid authentication token'
      });
    } else {
      return res.status(500).json({
        success: false,
        message: 'Logout failed',
        debug: error.message
      });
    }
  }

};

module.exports = { loginUser, registeruser, verifyEmail, resendVerificationEmail, logoutUser };