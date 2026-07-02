import express = require('express');
import wantedController = require('../controllers/wanted.controller');
import authMiddleware = require('../middlewares/auth.middleware');
import uploadMiddleware = require('../middlewares/uploadV2.middleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

// Upload de múltiplas fotos: principal + até 5 adicionais
router.post('/', uploadMiddleware.upload.fields([
  { name: 'fotoPrincipal', maxCount: 1 },
  { name: 'outrasFotos', maxCount: 5 }
]), wantedController.createWanted);
router.get('/', wantedController.listWanted);
router.get('/:id', wantedController.getWanted);

export = router;
