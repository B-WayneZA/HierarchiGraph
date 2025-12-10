"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAuth = exports.auth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authService_1 = require("../services/authService");
const auth = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            res.status(401).json({ message: 'No token, authorization denied' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        const user = await (0, authService_1.getUserById)(decoded.userId);
        if (!user || !user.isActive) {
            res.status(401).json({ message: 'Token is not valid' });
            return;
        }
        delete user.password; // remove sensitve information
        req.user = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Token is not valid' });
    }
};
exports.auth = auth;
const adminAuth = async (req, res, next) => {
    try {
        await (0, exports.auth)(req, res, () => { });
        if (req.user && req.user.role === 'admin') {
            next();
        }
        else {
            res.status(403).json({ message: 'Access denied. Admin privileges required.' });
        }
    }
    catch (error) {
        res.status(401).json({ message: 'Authentication failed' });
    }
};
exports.adminAuth = adminAuth;
//# sourceMappingURL=auth.js.map