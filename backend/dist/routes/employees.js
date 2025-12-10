"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const employeeService_1 = require("../services/employeeService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// @route   GET /api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth_1.auth, async (req, res) => {
    try {
        const { department, isActive, managerId } = req.query;
        const filters = {
            department: department,
            isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
            managerId: managerId
        };
        const employees = await employeeService_1.EmployeeService.getAllEmployees(filters);
        res.json(employees);
    }
    catch (error) {
        console.error('Get employees error:', error);
        res.status(500).json({ message: error.message });
    }
});
// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth_1.auth, async (req, res) => {
    try {
        const employee = await employeeService_1.EmployeeService.getEmployeeById(req.params.id);
        res.json(employee);
    }
    catch (error) {
        console.error('Get employee error:', error);
        res.status(404).json({ message: error.message });
    }
});
// @route   POST /api/employees
// @desc    Create a new employee
// @access  Private (Admin only)
router.post('/', [
    auth_1.adminAuth,
    (0, express_validator_1.body)('employeeId').notEmpty().withMessage('Employee ID is required'),
    (0, express_validator_1.body)('firstName').notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').notEmpty().withMessage('Last name is required'),
    (0, express_validator_1.body)('email').isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('position').notEmpty().withMessage('Position is required'),
    (0, express_validator_1.body)('department').notEmpty().withMessage('Department is required'),
    (0, express_validator_1.body)('salary').isNumeric().withMessage('Salary must be a number'),
    (0, express_validator_1.body)('hireDate').optional().isISO8601().withMessage('Invalid hire date')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const employee = await employeeService_1.EmployeeService.createEmployee(req.body);
        res.status(201).json(employee);
    }
    catch (error) {
        console.error('Create employee error:', error);
        res.status(400).json({ message: error.message });
    }
});
// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Admin only)
router.put('/:id', [
    auth_1.adminAuth,
    (0, express_validator_1.body)('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
    (0, express_validator_1.body)('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
    (0, express_validator_1.body)('email').optional().isEmail().withMessage('Please enter a valid email'),
    (0, express_validator_1.body)('position').optional().notEmpty().withMessage('Position cannot be empty'),
    (0, express_validator_1.body)('department').optional().notEmpty().withMessage('Department cannot be empty'),
    (0, express_validator_1.body)('salary').optional().isNumeric().withMessage('Salary must be a number')
], async (req, res) => {
    try {
        const errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        const employee = await employeeService_1.EmployeeService.updateEmployee(req.params.id, req.body);
        res.json(employee);
    }
    catch (error) {
        console.error('Update employee error:', error);
        res.status(400).json({ message: error.message });
    }
});
// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin only)
router.delete('/:id', auth_1.adminAuth, async (req, res) => {
    try {
        const result = await employeeService_1.EmployeeService.deleteEmployee(req.params.id);
        res.json(result);
    }
    catch (error) {
        console.error('Delete employee error:', error);
        res.status(400).json({ message: error.message });
    }
});
// @route   GET /api/employees/hierarchy/tree
// @desc    Get organizational hierarchy tree
// @access  Private
router.get('/hierarchy/tree', auth_1.auth, async (req, res) => {
    try {
        const hierarchyTree = await employeeService_1.EmployeeService.getHierarchyGraphData();
        res.json(hierarchyTree);
    }
    catch (error) {
        console.error('Get hierarchy tree error:', error);
        res.status(500).json({ message: error.message });
    }
});
// @route   GET /api/employees/departments/list
// @desc    Get all departments
// @access  Private
router.get('/departments/list', auth_1.auth, async (req, res) => {
    try {
        const departments = await employeeService_1.EmployeeService.getDepartments();
        res.json(departments);
    }
    catch (error) {
        console.error('Get departments error:', error);
        res.status(500).json({ message: error.message });
    }
});
// @route   GET /api/employees/managers/list
// @desc    Get all managers
// @access  Private
router.get('/managers/list', auth_1.auth, async (req, res) => {
    try {
        const managers = await employeeService_1.EmployeeService.getManagers();
        res.json(managers);
    }
    catch (error) {
        console.error('Get managers error:', error);
        res.status(500).json({ message: error.message });
    }
});
router.get('/avatar/:email', async (req, res) => {
    try {
        const avatar = await employeeService_1.EmployeeService.getAvatar(req.params.email);
        res.json(avatar);
    }
    catch (error) {
        console.error('Get avatar error:', error);
        res.status(500).json({ message: error.message });
    }
});
exports.default = router;
//# sourceMappingURL=employees.js.map