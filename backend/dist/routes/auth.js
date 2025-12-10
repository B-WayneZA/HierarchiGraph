"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const authService_1 = require("../services/authService");
const router = express_1.default.Router();
// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await authService_1.AuthService.registerUser(req.body);
        res.status(201).json(result);
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(400).json({ message: error.message });
    }
});
// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', [
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('password').exists().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const result = await authService_1.AuthService.loginUser(req.body);
        res.json(result);
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(400).json({ message: error.message });
    }
});
// @route   GET /api/auth/me
// @desc    Get current user
// @access  Private
router.get('/me', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ message: 'No token, authorization denied' });
        }
        const decoded = await authService_1.AuthService.validateToken(token);
        const user = await authService_1.AuthService.getCurrentUser(decoded.userId);
        res.json({ user });
    }
    catch (error) {
        console.error('Get user error:', error);
        res.status(401).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map