import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';

export default {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attack another user!")
    .addUserOption((option) =>
      option
        .setName("person")
        .setDescription("The person you want to attack.")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("type")
        .setDescription("How you want to attack them.")
        .setRequired(true)
        .addChoices(
          { name: "👋 Slap", value: "slap" },
          { name: "👊 Punch", value: "punch" },
          { name: "🔨 Bonk", value: "bonk" },
          { name: "🦷 Bite", value: "bite" },
          { name: "🦵 Kick", value: "kick" }
        )
    ),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const attacker = interaction.member;
    const target = interaction.options.getMember("person");
    const type = interaction.options.getString("type");

    // Wrong usage / invalid target
    if (!target) {
      const embed = warningEmbed(
        "❌ Wrong Usage",
        `Please provide a valid person to attack.\n\n` +
        `**Available attack types:**\n` +
        `👋 Slap\n` +
        `👊 Punch\n` +
        `🔨 Bonk\n` +
        `🦷 Bite\n` +
        `🦵 Kick`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent attacking yourself
    if (attacker.id === target.id) {
      const embed = warningEmbed(
        "💥 Invalid Target",
        `**${attacker.displayName}**, you can't attack yourself!`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Prevent attacking bots
    if (target.user.bot) {
      const embed = warningEmbed(
        "🤖 Invalid Target",
        "You can't attack a bot! Pick a real person instead."
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    // Server nickname, falling back to display name
    const attackerName =
      attacker.nickname || attacker.user.displayName;

    const targetName =
      target.nickname || target.user.displayName;

    const attacks = {
      slap: {
        emoji: "👋",
        name: "Slap",
        verb: "slaps"
      },

      punch: {
        emoji: "👊",
        name: "Punch",
        verb: "punches"
      },

      bonk: {
        emoji: "🔨",
        name: "Bonk",
        verb: "bonks"
      },

      bite: {
        emoji: "🦷",
        name: "Bite",
        verb: "bites"
      },

      kick: {
        emoji: "🦵",
        name: "Kick",
        verb: "kicks"
      }
    };

    const attack = attacks[type];

    // Safety check in case an invalid type somehow gets through
    if (!attack) {
      const embed = warningEmbed(
        "❌ Wrong Usage",
        `That isn't a valid attack type!\n\n` +
        `**Available attack types:**\n` +
        `👋 Slap\n` +
        `👊 Punch\n` +
        `🔨 Bonk\n` +
        `🦷 Bite\n` +
        `🦵 Kick`
      );

      return await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }

    try {
      // Nekos.Best returns a random GIF for the selected category
      const response = await fetch(
        `https://nekos.best/api/v2/${type}?amount=1`,
        {
          headers: {
            "User-Agent": "SoverignSMPBot/1.0 (Discord Bot)"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Nekos.Best API returned HTTP ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Nekos.Best response:", data);

      const gifUrl = data?.results?.[0]?.url;

      if (!gifUrl) {
        throw new Error("Nekos.Best did not return a GIF URL.");
      }

      const embed = successEmbed(
        `${attack.emoji} ${attack.name}!`,
        `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`
      );

      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Attack GIF error:", error);

      const embed = warningEmbed(
        "⚠️ GIF Error",
        `**${attackerName}** ${attack.verb} **${targetName}**!\n\n` +
        `I couldn't load the attack GIF right now, but the attack still happened!`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};
