import { Router } from 'express';
import { internalCommsController } from '../controllers/internalCommsController';
import { requireDashboardUser } from '../middleware/discordAuth';

const router = Router();

router.use(requireDashboardUser);

router.get('/servers', internalCommsController.listServers);
router.post('/servers', internalCommsController.createServer);
router.get('/servers/:id/channels', internalCommsController.listChannels);
router.post('/servers/:id/channels', internalCommsController.createChannel);
router.get('/channels/:id/messages', internalCommsController.listMessages);
router.post('/channels/:id/messages', internalCommsController.createMessage);
router.get('/servers/:id/members', internalCommsController.listMembers);
router.post('/voice/join', internalCommsController.joinVoice);
router.post('/voice/leave', internalCommsController.leaveVoice);
router.get('/bot/status', internalCommsController.getBotStatus);

export default router;
