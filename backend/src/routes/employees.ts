import express from 'express';
import { body, validationResult } from 'express-validator';
import { EmployeeService } from '../services/employeeService';
import { auth, adminAuth } from '../middleware/auth';

const router = express.Router();

// @route   GET /api/employees
// @desc    Get all employees
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { department, isActive, managerId } = req.query;
    const filters = {
      department: department as string,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      managerId: managerId as string
    };

    const employees = await EmployeeService.getAllEmployees(filters);
    res.json(employees);
  } catch (error: any) {
    console.error('Get employees error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/:id
// @desc    Get employee by ID
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const employee = await EmployeeService.getEmployeeById(req.params.id);
    res.json(employee);
  } catch (error: any) {
    console.error('Get employee error:', error);
    res.status(404).json({ message: error.message });
  }
});

// @route   POST /api/employees
// @desc    Create a new employee
// @access  Private (Admin only)
router.post('/', [
  adminAuth,
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('email').isEmail().withMessage('Please enter a valid email'),
  body('position').notEmpty().withMessage('Position is required'),
  body('department').notEmpty().withMessage('Department is required'),
  body('salary').isNumeric().withMessage('Salary must be a number'),
  body('hireDate').optional().isISO8601().withMessage('Invalid hire date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const employee = await EmployeeService.createEmployee(req.body);
    res.status(201).json(employee);
  } catch (error: any) {
    console.error('Create employee error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   PUT /api/employees/:id
// @desc    Update employee
// @access  Private (Admin only)
router.put('/:id', [
  adminAuth,
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().withMessage('Please enter a valid email'),
  body('position').optional().notEmpty().withMessage('Position cannot be empty'),
  body('department').optional().notEmpty().withMessage('Department cannot be empty'),
  body('salary').optional().isNumeric().withMessage('Salary must be a number')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const employee = await EmployeeService.updateEmployee(req.params.id, req.body);
    res.json(employee);
  } catch (error: any) {
    console.error('Update employee error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   DELETE /api/employees/:id
// @desc    Delete employee
// @access  Private (Admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const result = await EmployeeService.deleteEmployee(req.params.id);
    res.json(result);
  } catch (error: any) {
    console.error('Delete employee error:', error);
    res.status(400).json({ message: error.message });
  }
});

// @route   GET /api/employees/hierarchy/tree
// @desc    Get organizational hierarchy tree
// @access  Private
router.get('/hierarchy/tree', auth, async (req, res) => {
  try {
    const hierarchyTree = await EmployeeService.getHierarchyTree();
    res.json(hierarchyTree);
  } catch (error: any) {
    console.error('Get hierarchy tree error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/departments/list
// @desc    Get all departments
// @access  Private
router.get('/departments/list', auth, async (req, res) => {
  try {
    const departments = await EmployeeService.getDepartments();
    res.json(departments);
  } catch (error: any) {
    console.error('Get departments error:', error);
    res.status(500).json({ message: error.message });
  }
});

// @route   GET /api/employees/managers/list
// @desc    Get all managers
// @access  Private
router.get('/managers/list', auth, async (req, res) => {
  try {
    const managers = await EmployeeService.getManagers();
    res.json(managers);
  } catch (error: any) {
    console.error('Get managers error:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router;
