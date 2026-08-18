import { Router } from 'express';
import { internalCommsController } from '../controllers/internalCommsController';
import { requireDashboardUser } from '../middleware/discordAuth';

const router = Router();

router.get('/servers', requireDashboardUser, internalCommsController.listServers);
router.post('/servers', requireDashboardUser, internalCommsController.createServer);
router.get('/servers/:id/channels', requireDashboardUser, internalCommsController.listChannels);
router.post('/servers/:id/channels', requireDashboardUser, internalCommsController.createChannel);
router.get('/channels/:id/messages', requireDashboardUser, internalCommsController.listMessages);
router.post('/channels/:id/messages', requireDashboardUser, internalCommsController.createMessage);
router.get('/servers/:id/members', requireDashboardUser, internalCommsController.listMembers);
router.post('/voice/join', requireDashboardUser, internalCommsController.joinVoice);
router.post('/voice/leave', requireDashboardUser, internalCommsController.leaveVoice);
router.get('/bot/status', requireDashboardUser, internalCommsController.getBotStatus);

export default router;
