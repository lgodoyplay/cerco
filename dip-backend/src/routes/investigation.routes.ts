import express = require('express');
import investigationController = require('../controllers/investigation.controller');
import authMiddleware = require('../middlewares/auth.middleware');
import uploadMiddleware = require('../middlewares/upload.middleware');

const router = express.Router();
router.use(authMiddleware.authenticateToken);

router.post('/', investigationController.createInvestigation);
router.post('/:id/provas', uploadMiddleware.upload.single('arquivo'), investigationController.addEvidence);
router.post('/:id/finalizar', investigationController.finalizeInvestigation);
router.get('/', investigationController.listInvestigations);
router.get('/:id', investigationController.getInvestigation);

export = router;
