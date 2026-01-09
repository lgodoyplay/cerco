import express = require('express');
import wantedController = require('../controllers/wanted.controller');
import authMiddleware = require('../middlewares/auth.middleware');
import uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

router.post('/', uploadMiddleware.upload.fields([{ name: 'fotoPrincipal', maxCount: 1 }]), wantedController.createWanted);
router.get('/', wantedController.listWanted);
router.get('/:id', wantedController.getWanted);

export = router;
