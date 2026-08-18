import { Router } from 'express';
import { discordController } from '../controllers/discordController';
import { requireBotSecret, requireDashboardUser } from '../middleware/discordAuth';

const router = Router();

router.get('/health', (req, res) => res.json({ status: 'ok' }));
router.get('/guilds', requireDashboardUser, discordController.getGuilds);
router.get('/guilds/:guildId/channels', requireDashboardUser, discordController.getChannels);
router.get('/guilds/:guildId/members', requireDashboardUser, discordController.getMembers);
router.get('/channels/:channelId/messages', requireDashboardUser, discordController.getMessages);
router.post('/channels/:channelId/messages', requireDashboardUser, discordController.sendMessage);
router.get('/members/:memberId', requireDashboardUser, discordController.getMember);
router.get('/bot/status', requireDashboardUser, discordController.getBotStatus);
router.put('/messages/:messageId/reactions', requireDashboardUser, discordController.addReaction);
router.delete('/messages/:messageId/reactions/:emoji', requireDashboardUser, discordController.removeReaction);
router.post('/bot/events', requireBotSecret, discordController.handleBotEvent);
router.post('/jitsi/room', requireDashboardUser, discordController.createJitsiRoom);

export default router;
