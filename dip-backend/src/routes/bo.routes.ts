import express = require('express');
import boController = require('../controllers/bo.controller');
import authMiddleware = require('../middlewares/auth.middleware');

const router = express.Router();
router.use(authMiddleware.authenticateToken);
router.post('/', boController.createBO);
router.get('/', boController.listBO);

export = router;
