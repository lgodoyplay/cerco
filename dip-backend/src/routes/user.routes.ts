import express = require('express');
import userController = require('../controllers/user.controller');
import authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware.authenticateToken);
router.post('/', userController.createUser);
router.get('/', userController.listUsers);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export = router;
