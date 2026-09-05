export const BOT_OWNER_ID = '1281977840648327292';
export const HQ_GUILD_ID = '1473773901753618580';
export const BOT_CLIENT_ID = '1541748691063283742';

export function isBotOwner(userId) {
  return String(userId) === BOT_OWNER_ID;
}

export function isHQGuild(guildId) {
  return String(guildId) === HQ_GUILD_ID;
}

export function assertHQOwner(interaction) {
  return Boolean(
    interaction?.guildId &&
    isHQGuild(interaction.guildId) &&
    isBotOwner(interaction.user?.id)
  );
}
