import express = require('express');
import authController = require('../controllers/auth.controller');

const router = express.Router();

router.post('/login', authController.login);

export = router;
