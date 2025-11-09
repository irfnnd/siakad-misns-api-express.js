const { body, param } = require('express-validator');

const userValidation = {
  // Validation for creating user
  createUser: [
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username harus antara 3-50 karakter')
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage('Username hanya boleh mengandung huruf, angka, titik, dan underscore'),
    
    body('email')
      .isEmail()
      .withMessage('Email tidak valid')
      .normalizeEmail(),
    
    body('password')
      .isLength({ min: 6 })
      .withMessage('Password minimal 6 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka'),
    
    body('role')
      .isIn(['Admin', 'Guru'])
      .withMessage('Role harus Admin atauGuru'),
    
    body('status')
      .optional()
      .isIn(['Aktif', 'Nonaktif'])
      .withMessage('Status harus Aktif atau Nonaktif')
  ],

  // Validation for updating user
  updateUser: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID user tidak valid'),
    
    body('username')
      .optional()
      .isLength({ min: 3, max: 50 })
      .withMessage('Username harus antara 3-50 karakter')
      .matches(/^[a-zA-Z0-9_.]+$/)
      .withMessage('Username hanya boleh mengandung huruf, angka, titik, dan underscore'),
    
    body('email')
      .optional()
      .isEmail()
      .withMessage('Email tidak valid')
      .normalizeEmail(),
    
    body('role')
      .optional()
      .isIn(['Admin', 'Guru'])
      .withMessage('Role harus Admin atau Guru'),
    
    body('status')
      .optional()
      .isIn(['Aktif', 'Nonaktif'])
      .withMessage('Status harus Aktif atau Nonaktif')
  ],

  // Validation for changing password
  changePassword: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID user tidak valid'),
    
    body('current_password')
      .notEmpty()
      .withMessage('Password saat ini harus diisi'),
    
    body('new_password')
      .isLength({ min: 6 })
      .withMessage('Password baru minimal 6 karakter')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
      .withMessage('Password harus mengandung huruf besar, huruf kecil, dan angka')
  ],

  // Validation for user ID parameter
  userIdParam: [
    param('id')
      .isInt({ min: 1 })
      .withMessage('ID user tidak valid')
  ]
};

module.exports = userValidation;