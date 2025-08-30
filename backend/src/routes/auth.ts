import express from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from '../services/authService';

const router = express.Router();

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await AuthService.registerUser(req.body);
    res.status(201).json(result);
  } catch (error: any) {
    console.error('Register error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('password').exists().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const result = await AuthService.loginUser(req.body);
    res.json(result);
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req: any, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ message: 'No token, authorization denied' });
    }

    const decoded = await AuthService.validateToken(token);
    const user = await AuthService.getCurrentUser(decoded.userId);
    
    res.json({ user });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(401).json({ message: error.message });
  }
});

export default router;
