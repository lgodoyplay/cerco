import express = require('express');
import publicController = require('../controllers/public.controller');

const router = express.Router();

router.get('/procurados', publicController.getPublicWanted);
router.get('/presos', publicController.getPublicArrests);

export = router;
