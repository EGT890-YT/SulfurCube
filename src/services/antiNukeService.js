import { AuditLogEvent, PermissionFlagsBits } from 'discord.js';
import { logger } from '../utils/logger.js';
import { isBotOwner } from '../config/bot.js';
import { getGuildConfig, updateGuildConfig } from './config/guildConfig.js';

const DEFAULT_CONFIG = Object.freeze({
  enabled: true,
  threshold: 3,
  windowMs: 3_000,
  action: 'ban',
});

const ACTIONS = new Set(['channelDelete', 'roleDelete', 'ban', 'kick']);

const AUDIT_TYPES = {
  channelDelete: AuditLogEvent.ChannelDelete,
  roleDelete: AuditLogEvent.RoleDelete,
  ban: AuditLogEvent.MemberBanAdd,
  kick: AuditLogEvent.MemberKick,
};

const state = new Map();

function getConfig(guildConfig) {
  const configured = guildConfig?.antiNuke ?? {};
  return {
    ...DEFAULT_CONFIG,
    ...configured,
    threshold: Math.max(2, Number(configured.threshold ?? DEFAULT_CONFIG.threshold)),
    windowMs: Math.max(1_000, Number(configured.windowMs ?? DEFAULT_CONFIG.windowMs)),
  };
}

async function getExecutor(guild, auditType, targetId) {
  try {
    const logs = await guild.fetchAuditLogs({ type: auditType, limit: 5 });
    const entry = logs.entries.find(entry =>
      entry.target?.id === targetId &&
      Date.now() - entry.createdTimestamp < 5_000
    );
    return entry?.executor ?? null;
  } catch (error) {
    logger.warn('Anti-Nuke could not read audit logs in ' + guild.name + ': ' + error.message);
    return null;
  }
}

async function protect(guild, actionType, targetId, client) {
  if (!guild || !ACTIONS.has(actionType)) return;

  const guildConfig = await getGuildConfig(client, guild.id);
  const config = getConfig(guildConfig);
  if (!config.enabled) return;

  const executor = await getExecutor(guild, AUDIT_TYPES[actionType], targetId);
  if (!executor) return;

  if (executor.id === client.user?.id || isBotOwner(executor.id, client)) return;

  const member = await guild.members.fetch(executor.id).catch(() => null);
  if (!member) return;

  const key = guild.id + ':' + executor.id;
  const now = Date.now();
  const entries = (state.get(key) ?? []).filter(timestamp => now - timestamp < config.windowMs);
  entries.push(now);
  state.set(key, entries);

  logger.warn(
    'Anti-Nuke detected ' + actionType + ' by ' + executor.tag + ' in ' + guild.name +
    ' (' + entries.length + '/' + config.threshold + ').'
  );

  if (entries.length < config.threshold) return;

  state.delete(key);

  const botMember = guild.members.me;
  if (!botMember?.permissions.has(PermissionFlagsBits.BanMembers)) {
    logger.error('Anti-Nuke cannot ban ' + executor.tag + ' in ' + guild.name + ': SulfurCube lacks Ban Members.');
    return;
  }

  if (member.roles.highest.position >= botMember.roles.highest.position) {
    logger.warn('Anti-Nuke could not ban ' + executor.tag + ': role hierarchy prevents the action.');
    return;
  }

  try {
    await guild.members.ban(member, {
      deleteMessageSeconds: 7 * 24 * 60 * 60,
      reason: 'SulfurCube Anti-Nuke: ' + config.threshold + ' destructive actions in ' + (config.windowMs / 1000) + 's',
    });

    logger.warn(
      'Anti-Nuke stopped ' + executor.tag + ' in ' + guild.name +
      ' after ' + entries.length + ' destructive actions.'
    );
  } catch (error) {
    logger.error('Anti-Nuke failed to stop ' + executor.tag + ' in ' + guild.name + ':', error);
  }
}

export async function handleAntiNukeEvent(guild, actionType, targetId, client) {
  await protect(guild, actionType, targetId, client);
}

export async function setAntiNukeEnabled(client, guildId, enabled) {
  const config = await getGuildConfig(client, guildId);
  await updateGuildConfig(client, guildId, {
    ...config,
    antiNuke: {
      ...getConfig(config),
      enabled: enabled === true,
    },
  });
}

export function resetAntiNukeState(guildId) {
  for (const key of state.keys()) {
    if (key.startsWith(guildId + ':')) state.delete(key);
  }
}

export const ANTI_NUKE_DEFAULTS = DEFAULT_CONFIG;
