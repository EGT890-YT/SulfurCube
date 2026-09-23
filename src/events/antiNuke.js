import { Events } from 'discord.js';
import { handleAntiNukeEvent } from '../services/antiNukeService.js';

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
      client.on(eventName, async (...args) => {
        try {
          const target = args[0];
          const guild = target?.guild ?? target?.guildId
            ? (target.guild ?? client.guilds.cache.get(target.guildId))
            : null;

          if (!guild) return;

          await handleAntiNukeEvent(
            guild,
            actionType,
            target.id ?? target.user?.id,
            client,
          );
        } catch (error) {
          client.logger?.error?.('Anti-Nuke event error:', error);
        }
      });
    }
  },
};
