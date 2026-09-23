import { Events } from 'discord.js';
import { handleAntiNukeEvent } from '../services/antiNukeService.js';
import { logger } from '../utils/logger.js';

export default {
  name: Events.ClientReady,
  once: true,

  async execute(client) {
    const handlers = [
      [Events.ChannelDelete, 'channelDelete'],
      [Events.RoleDelete, 'roleDelete'],
      [Events.GuildBanAdd, 'ban'],
      [Events.GuildMemberRemove, 'kick'],
    ];

    for (const [eventName, actionType] of handlers) {
      client.on(eventName, async (target) => {
        try {
          const guild = target?.guild ?? client.guilds.cache.get(target?.guildId);
          if (!guild || !target?.id) return;

          await handleAntiNukeEvent(guild, actionType, target.id, client);
        } catch (error) {
          logger.error('Anti-Nuke event error:', error);
        }
      });
    }

    logger.info('🛡️ Anti-Nuke protection is monitoring destructive guild actions.');
  },
};
