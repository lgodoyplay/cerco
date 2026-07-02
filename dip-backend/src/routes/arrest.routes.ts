import express = require('express');
import arrestController = require('../controllers/arrest.controller');
import authMiddleware = require('../middlewares/auth.middleware');
import uploadMiddleware = require('../middlewares/uploadV2.middleware');

const router = express.Router();

router.use(authMiddleware.authenticateToken);

// Upload de múltiplas fotos: rosto, bolsa, tablet, abordagem
router.post('/', uploadMiddleware.upload.fields([
  { name: 'fotoRosto', maxCount: 1 },
  { name: 'fotoBolsa', maxCount: 1 },
  { name: 'fotoTablet', maxCount: 1 },
  { name: 'fotoAbordagem', maxCount: 1 }
]), arrestController.createArrest);
router.get('/', arrestController.listArrests);
router.get('/:id', arrestController.getArrest);

export = router;
