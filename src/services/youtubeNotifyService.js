import { EmbedBuilder } from 'discord.js';
import { getGuildConfig, updateGuildConfig } from './config/guildConfig.js';
import { logger } from '../utils/logger.js';

const FEED_URL = 'https://www.youtube.com/feeds/videos.xml?channel_id=';
const MAX_SUBSCRIPTIONS = 4;
const REQUEST_TIMEOUT = 10000;
const classificationCache = new Map();

function decodeXml(value = '') {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function getTag(xml, tag) {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : null;
}

function parseFeed(xml) {
  const entries = [];
  const matches = xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi);

  for (const match of matches) {
    const entry = match[1];
    const videoId = getTag(entry, 'yt:videoId');
    const title = getTag(entry, 'title');
    const published = getTag(entry, 'published');
    const author = getTag(entry, 'name');
    const linkMatch = entry.match(/<link[^>]+rel=["']alternate["'][^>]+href=["']([^"']+)["']/i);

    if (!videoId) continue;

    entries.push({
      videoId,
      title: title || 'New upload',
      published: published || null,
      author: author || 'YouTube',
      url: linkMatch?.[1] || `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  return entries;
}

function normalizeHandle(input) {
  const value = String(input || '').trim();
  const match = value.match(/youtube\.com\/@([^/?#\s]+)/i);
  if (match) return match[1];

  return value
    .replace(/^@/, '')
    .replace(/^https?:\/\/(?:www\.)?youtube\.com\//i, '')
    .split(/[/?#]/)[0];
}

export async function resolveYouTubeChannel(input) {
  const handle = normalizeHandle(input);

  if (!/^[A-Za-z0-9._-]{1,100}$/.test(handle)) {
    throw new Error('Invalid YouTube handle. Use something like @example or youtube.com/@example.');
  }

  const url = `https://www.youtube.com/@${handle}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  let response;
  try {
    response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SulfurCube/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`YouTube returned HTTP ${response.status}.`);

  const html = await response.text();
  const channelId =
    html.match(/<meta[^>]+itemprop=["']channelId["'][^>]+content=["'](UC[a-zA-Z0-9_-]+)["']/i)?.[1] ||
    html.match(/"channelId":"(UC[a-zA-Z0-9_-]+)"/i)?.[1] ||
    html.match(/"externalId":"(UC[a-zA-Z0-9_-]+)"/i)?.[1];

  if (!channelId) {
    throw new Error('I could not find that YouTube channel. Make sure the handle is correct.');
  }

  const title =
    html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)?.[1] ||
    `@${handle}`;

  return {
    handle: `@${handle}`,
    channelId,
    name: decodeXml(title),
    url,
  };
}

async function fetchFeed(channelId) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
  let response;
  try {
    response = await fetch(`${FEED_URL}${encodeURIComponent(channelId)}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; SulfurCube/1.0)',
        'Accept': 'application/atom+xml, application/xml;q=0.9, */*;q=0.8',
      },
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
  if (!response.ok) throw new Error(`YouTube feed returned HTTP ${response.status}.`);

  return parseFeed(await response.text());
}

async function classifyVideo(videoId) {
  const cached = classificationCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) return cached.type;

  let type = 'longform';

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    let response;
    try {
      response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; SulfurCube/1.0)',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        redirect: 'follow',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok) throw new Error(`YouTube returned HTTP ${response.status}.`);

    const html = String(response.data || '');
    const isLive =
      /"isLiveContent":true/i.test(html) ||
      /"isLiveNow":true/i.test(html) ||
      /"isLive":true/i.test(html);

    const isShort =
      /"isShorts":true/i.test(html) ||
      /"canonicalBaseUrl":"\/shorts\//i.test(html) ||
      /https:\/\/www\.youtube\.com\/shorts\//i.test(html);

    if (isLive) type = 'live';
    else if (isShort) type = 'shorts';
  } catch (error) {
    logger.warn(`Could not classify YouTube video ${videoId}: ${error.message}`);
  }

  classificationCache.set(videoId, {
    type,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  return type;
}

function buildNotificationEmbed(video, channel, type) {
  const labels = {
    live: '🔴 LIVE STREAM',
    longform: '🎬 NEW VIDEO',
    shorts: '📱 NEW SHORT',
  };

  return new EmbedBuilder()
    .setColor(type === 'live' ? '#ED4245' : type === 'shorts' ? '#FF0050' : '#5865F2')
    .setTitle(`${labels[type] || '📺 NEW UPLOAD'} — ${channel.name}`)
    .setDescription(`## [${video.title}](${video.url})`)
    .addFields(
      { name: 'Channel', value: `[${channel.name}](${channel.url})`, inline: true },
      { name: 'Type', value: labels[type] || type, inline: true },
    )
    .setURL(video.url)
    .setTimestamp(video.published ? new Date(video.published) : new Date())
    .setFooter({ text: 'SulfurCube • YouTube Notifications' });
}

export async function addYouTubeNotification(client, guildId, subscription) {
  const config = await getGuildConfig(client, guildId);
  const subscriptions = Array.isArray(config.notifyUploads) ? config.notifyUploads : [];

  if (subscriptions.length >= MAX_SUBSCRIPTIONS) {
    throw new Error(`You can only have ${MAX_SUBSCRIPTIONS} YouTube notification channels per server.`);
  }

  if (subscriptions.some(entry =>
    entry.channelId === subscription.channelId &&
    entry.youtubeChannelId === subscription.youtubeChannelId &&
    entry.type === subscription.type
  )) {
    throw new Error('That YouTube notification is already configured.');
  }

  const feed = await fetchFeed(subscription.youtubeChannelId);
  if (!feed.length) {
    throw new Error('That YouTube channel has no public uploads available to monitor.');
  }

  subscriptions.push({
    ...subscription,
    lastVideoId: feed[0].videoId,
    createdAt: Date.now(),
  });

  await updateGuildConfig(client, guildId, {
    notifyUploads: subscriptions,
  });

  return subscriptions.length;
}

export async function pollYouTubeNotifications(client) {
  for (const guild of client.guilds.cache.values()) {
    try {
      const config = await getGuildConfig(client, guild.id);
      const subscriptions = Array.isArray(config.notifyUploads) ? config.notifyUploads : [];
      if (!subscriptions.length) continue;

      let changed = false;
      const nextSubscriptions = [];

      for (const subscription of subscriptions.slice(0, MAX_SUBSCRIPTIONS)) {
        try {
          const feed = await fetchFeed(subscription.youtubeChannelId);
          if (!feed.length) {
            nextSubscriptions.push(subscription);
            continue;
          }

          const lastIndex = feed.findIndex(entry => entry.videoId === subscription.lastVideoId);

          if (lastIndex < 0) {
            subscription.lastVideoId = feed[0].videoId;
            changed = true;
            nextSubscriptions.push(subscription);
            continue;
          }

          const newEntries = feed.slice(0, lastIndex).reverse();

          for (const video of newEntries) {
            const type = await classifyVideo(video.videoId);
            if (subscription.type !== type) continue;

            const channel = await guild.channels.fetch(subscription.channelId).catch(() => null);
            if (!channel?.isTextBased()) continue;

            const ping = subscription.ping;
            const allowedMentions = {
              parse: ping === '@everyone' || ping === '@here' ? ['everyone'] : [],
              roles: [],
              users: [],
            };

            const roleMatch = ping.match(/^<@&(\d+)>$/);
            const userMatch = ping.match(/^<@!?(\d+)>$/);

            if (roleMatch) allowedMentions.roles.push(roleMatch[1]);
            else if (userMatch) allowedMentions.users.push(userMatch[1]);

            await channel.send({
              content: ping,
              embeds: [buildNotificationEmbed(video, {
                name: subscription.youtubeChannelName,
                url: `https://www.youtube.com/@${subscription.youtubeHandle.replace(/^@/, '')}`,
              }, type)],
              allowedMentions,
            });
          }

          subscription.lastVideoId = feed[0].videoId;
          changed = true;
        } catch (error) {
          logger.warn(`YouTube notification check failed for guild ${guild.id}: ${error.message}`);
        }

        nextSubscriptions.push(subscription);
      }

      if (changed) {
        await updateGuildConfig(client, guild.id, {
          notifyUploads: nextSubscriptions,
        });
      }
    } catch (error) {
      logger.error(`YouTube notification polling failed for guild ${guild.id}:`, error);
    }
  }
}

export { MAX_SUBSCRIPTIONS };

