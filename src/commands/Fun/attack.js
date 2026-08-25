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

    // Get server nicknames, falling back to display name
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

    try {
      // Get a random GIF for the selected attack type
      const response = await fetch(
        `https://nekos.best/api/v2/${type}?amount=1`,
        {
          headers: {
            "User-Agent": "SoverignSMP-Bot/1.0 (Discord Bot)"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          `Nekos.Best API returned ${response.status}`
        );
      }

      const data = await response.json();

      const gifUrl = data?.results?.[0]?.url;

      if (!gifUrl) {
        console.error("Nekos.Best response:", data);
        throw new Error("No GIF URL was returned.");
      }

      const embed = successEmbed(
        `${attack.emoji} ${attack.name}!`,
        `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`
      );

      // Add the random GIF
      embed.setImage(gifUrl);

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });

    } catch (error) {
      console.error("Attack GIF error:", error);

      // Still send the attack message if the GIF API fails
      const embed = successEmbed(
        `${attack.emoji} ${attack.name}!`,
        `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`
      );

      await InteractionHelper.safeEditReply(interaction, {
        embeds: [embed]
      });
    }
  },
};
