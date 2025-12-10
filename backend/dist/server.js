"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./config/database");
const auth_1 = __importDefault(require("./routes/auth"));
const employees_1 = __importDefault(require("./routes/employees"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Connect to AWS Neptune
(0, database_1.connectDB)().catch((error) => {
    console.error('Failed to connect to Neptune:', error);
    process.exit(1);
});
// Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://www.gravatar.com"],
        },
    },
}));
app.use((0, cors_1.default)({
    origin: process.env.NODE_ENV === 'production'
        ? ['http://13.60.163.88'] // Your EC2 IP
        : ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use((0, morgan_1.default)('combined'));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/employees', employees_1.default);
// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        database: 'Connected',
        version: '1.0.0'
    });
});
// API documentation endpoint
app.get('/api', (req, res) => {
    res.json({
        name: 'HierarchiGraph API',
        version: '1.0.0',
        description: 'Employee Hierarchy Management System API',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register a new user',
                'POST /api/auth/login': 'User login',
                'GET /api/auth/me': 'Get current user'
            },
            employees: {
                'GET /api/employees': 'Get all employees',
                'GET /api/employees/:id': 'Get employee by ID',
                'POST /api/employees': 'Create new employee (Admin only)',
                'PUT /api/employees/:id': 'Update employee (Admin only)',
                'DELETE /api/employees/:id': 'Delete employee (Admin only)',
                'GET /api/employees/hierarchy/tree': 'Get organizational hierarchy',
                'GET /api/employees/departments/list': 'Get all departments',
                'GET /api/employees/managers/list': 'Get all managers'
            }
        }
    });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error('❌ Server error:', err);
    // Database connection errors
    if (err.message && err.message.includes('Database not connected')) {
        return res.status(503).json({
            message: 'Database connection error. Please try again later.',
            error: process.env.NODE_ENV === 'development' ? err.message : 'Database error'
        });
    }
    // Validation errors
    if (err.name === 'ValidationError' || err.message?.includes('Validation error')) {
        return res.status(400).json({
            message: 'Validation error',
            errors: err.errors ? Object.values(err.errors).map((e) => e.message) : [err.message]
        });
    }
    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ message: 'Invalid token' });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired' });
    }
    // Default error
    res.status(500).json({
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});
// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({
        message: 'Route not found',
        path: req.originalUrl,
        method: req.method
    });
});
// Start server
app.listen(PORT, () => {
    console.log('🚀 Server started successfully!');
    console.log(`📡 Server running on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
    console.log(`📚 API docs: http://localhost:${PORT}/api`);
    if (process.env.NODE_ENV === 'development') {
        console.log(`🎯 Frontend URL: http://localhost:3000`);
    }
});
// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully');
    process.exit(0);
});
process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully');
    process.exit(0);
});
// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    process.exit(1);
});
//# sourceMappingURL=server.js.map