"use strict";
const express = require("express");
const publicController = require("../controllers/public.controller");
const router = express.Router();
router.get('/procurados', publicController.getPublicWanted);
router.get('/presos', publicController.getPublicArrests);
module.exports = router;
