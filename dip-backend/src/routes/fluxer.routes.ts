import { Router } from 'express';
import { fluxerController } from '../controllers/fluxerController';

const router = Router();

router.get('/guilds', fluxerController.listGuilds);
router.get('/guilds/:guildId/channels', fluxerController.listChannels);
router.get('/guilds/:guildId/members', fluxerController.listMembers);
router.get('/channels/:channelId/messages', fluxerController.listMessages);
router.get('/channels/:channelId/messages/:messageId', fluxerController.getMessage);
router.post('/channels/:channelId/messages', fluxerController.sendMessage);
router.patch('/channels/:channelId/messages/:messageId', fluxerController.editMessage);
router.delete('/channels/:channelId/messages/:messageId', fluxerController.deleteMessage);
router.put('/channels/:channelId/messages/:messageId/reactions/:emoji', fluxerController.addReaction);
router.delete('/channels/:channelId/messages/:messageId/reactions/:emoji', fluxerController.removeReaction);
router.post('/channels/:channelId/call', fluxerController.startVoiceCall);
router.post('/channels/:channelId/call/end', fluxerController.endVoiceCall);
router.get('/bot/status', fluxerController.getBotStatus);
router.get('/gateway/bot', fluxerController.gatewayInfo);
router.post('/jitsi/room', fluxerController.createJitsiRoom);

export default router;
