import express = require('express');
import arrestController = require('../controllers/arrest.controller');
import authMiddleware = require('../middlewares/auth.middleware');
import uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.post('/', uploadMiddleware.upload.fields([{ name: 'fotoRosto', maxCount: 1 }]), arrestController.createArrest);
router.get('/', arrestController.listArrests);
router.get('/:id', arrestController.getArrest);

export = router;
