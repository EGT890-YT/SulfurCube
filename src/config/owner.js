// SulfurCube application identifiers.
// These are intentionally hard-coded so the bot does not depend on environment
// variables for its Discord application/bot configuration.
export const HQ_GUILD_ID = '1473773901753618580';
export const BOT_CLIENT_ID = '1281977840648327292';
export const DISCORD_BOT_ID = '1541748691063283742';
export const BOT_OWNER_ID = '1281977840648327292';

export function isBotOwner(userId, client = null) {
  if (!userId) return false;

  const normalizedUserId = String(userId);

  // Explicit owner ID configured for this bot.
  if (normalizedUserId === BOT_OWNER_ID) return true;

  const applicationOwner = client?.application?.owner;

  // Discord's application owner is also accepted as the owner. This keeps
  // ownership working if the application is transferred in Discord later.
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
