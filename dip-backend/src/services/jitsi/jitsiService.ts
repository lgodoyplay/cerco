import crypto from 'crypto';

const JITSI_DOMAIN = process.env.JITSI_DOMAIN || 'meet.jit.si';
const JITSI_ROOM_PREFIX = 'cerco';

const getRoomSalt = () => process.env.JITSI_ROOM_SALT || 'cerco-jitsi-room-salt';

export interface JitsiRoomPayload {
  roomName: string;
  domain: string;
  type: 'voice' | 'video';
}

const generateSecureRoomName = (conversationId: string, type: 'voice' | 'video' = 'voice'): string => {
  const salt = getRoomSalt();
  const raw = `${conversationId}:${type}:${salt}`;
  const hash = crypto.createHash('sha256').update(raw).digest('hex').slice(0, 16);
  return `${JITSI_ROOM_PREFIX}-${type}-${hash}`;
};

export const createJitsiRoom = (conversationId: string, type: 'voice' | 'video' = 'voice'): JitsiRoomPayload => {
  const roomName = generateSecureRoomName(conversationId, type);
  return {
    roomName,
    domain: JITSI_DOMAIN,
    type,
  };
};

export const getJitsiDomain = () => JITSI_DOMAIN;
