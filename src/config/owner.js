export const BOT_OWNER_ID = process.env.BOT_OWNER_ID?.trim() || null;
export const HQ_GUILD_ID = '1473773901753618580';
export const BOT_CLIENT_ID = '1281977840648327292';

export function isBotOwner(userId, client = null) {
  if (!userId) return false;

  const normalizedUserId = String(userId);
  if (BOT_OWNER_ID && normalizedUserId === BOT_OWNER_ID) return true;

  const applicationOwner = client?.application?.owner;
  if (!applicationOwner) return false;

  if (applicationOwner.user?.id) {
    return String(applicationOwner.user.id) === normalizedUserId;
  }

  if (applicationOwner.id) {
    return String(applicationOwner.id) === normalizedUserId;
  }

  return false;
}

export function isHQGuild(guildId) {
  return String(guildId) === HQ_GUILD_ID;
}

export function assertHQOwner(interaction) {
  return Boolean(
    interaction?.guildId &&
    isHQGuild(interaction.guildId) &&
    isBotOwner(interaction.user?.id, interaction.client)
  );
}
