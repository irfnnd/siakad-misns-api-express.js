const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

// Apply authentication to all routes
router.use(authenticate);

// Get user statistics (Admin only)
router.get('/stats', authorize('Admin'), userController.getUserStats);

// Get all users with pagination and filters
router.get('/', authorize('Admin', 'Guru'), userController.getAllUsers);

// Get user by ID
router.get('/:id', authorize('Admin', 'Guru'), userController.getUserById);

// Create new user (Admin only)
router.post('/', authorize('Admin'), userController.createUser);

// Update user (Admin only)
router.put('/:id', authorize('Admin'), userController.updateUser);

// Update user status (Admin only)
router.patch('/:id/status', authorize('Admin'), userController.updateUserStatus);

// Change password
router.patch('/:id/password', userController.changePassword);

// Delete user (Admin only)
router.delete('/:id', authorize('Admin'), userController.deleteUser);

module.exports = router;