"use strict";
const express = require("express");
const boController = require("../controllers/bo.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const router = express.Router();
router.use(authMiddleware.authenticateToken);
router.post('/', boController.createBO);
router.get('/', boController.listBO);
module.exports = router;
