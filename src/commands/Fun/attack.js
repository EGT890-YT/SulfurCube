import { SlashCommandBuilder } from 'discord.js';
import { successEmbed, warningEmbed } from '../../utils/embeds.js';
import { InteractionHelper } from '../../utils/interactionHelper.js';
import { BOT_OWNER_ID } from '../../config/owner.js';

export default {
  data: new SlashCommandBuilder()
    .setName("attack")
    .setDescription("Attack another user!")
    .addUserOption((option) => option.setName("person").setDescription("The person you want to attack.").setRequired(true))
    .addStringOption((option) => option.setName("type").setDescription("How you want to attack them.").setRequired(true).addChoices(
      { name: "👋 Slap", value: "slap" },
      { name: "👊 Punch", value: "punch" },
      { name: "🔨 Bonk", value: "bonk" },
      { name: "🦷 Bite", value: "bite" },
      { name: "🦵 Kick", value: "kick" },
      { name: "🖕 Finger", value: "finger" }
    )),

  category: 'Fun',

  async execute(interaction, config, client) {
    await InteractionHelper.safeDefer(interaction);

    const attacker = interaction.member;
    const target = interaction.options.getMember("person");
    const type = interaction.options.getString("type");

    const attacks = {
      slap: { emoji: "👋", name: "Slap", verb: "slaps", search: "slap" },
      punch: { emoji: "👊", name: "Punch", verb: "punches", search: "punch" },
      bonk: { emoji: "🔨", name: "Bonk", verb: "bonks", search: "bonk" },
      bite: { emoji: "🦷", name: "Bite", verb: "bites", search: "bite" },
      kick: { emoji: "🦵", name: "Kick", verb: "kicks", search: "kick" },
      finger: { emoji: "🖕", name: "Finger", verb: "gives the finger to", search: "middle finger" }
    };

    const attack = attacks[type];

    if (!target || !attack) {
      const embed = warningEmbed("❌ Wrong Usage", `Please provide a valid person and attack type.\n\n**Available attack types:**\n👋 **Slap**\n👊 **Punch**\n🔨 **Bonk**\n🦷 **Bite**\n🦵 **Kick**\n🖕 **Finger**`);
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    // The bot owner is attack-immune. This does not affect /hug, /ship, /tickle, etc.
    if (target.id === BOT_OWNER_ID) {
      const embed = warningEmbed("🛡️ Attack Blocked", `**${target.displayName}** is protected from attacks. Nice try 😭`);
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    if (attacker.id === target.id) {
      const embed = warningEmbed("💥 Invalid Target", `**${attacker.displayName}**, you can't attack yourself!`);
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    if (target.user.bot) {
      const embed = warningEmbed("🤖 Invalid Target", "You can't attack a bot! Pick a real person instead.");
      return InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }

    const attackerName = attacker.nickname || attacker.user.displayName;
    const targetName = target.nickname || target.user.displayName;

    try {
      const apiUrl = `https://gifsnap.com/api/v1/gifs/search?q=${encodeURIComponent(attack.search)}&page=1&limit=25`;
      const response = await fetch(apiUrl);
      if (!response.ok) throw new Error(`GifSnap API returned HTTP ${response.status}`);
      const data = await response.json();
      const gifs = Array.isArray(data.data) ? data.data.filter((gif) => gif && gif.type === "gif" && gif.url) : [];
      if (gifs.length === 0) throw new Error(`No GIFs found for "${attack.search}".`);

      const randomGif = gifs[Math.floor(Math.random() * gifs.length)];
      const embed = successEmbed(`${attack.emoji} ${attack.name}!`, `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`);
      embed.setImage(randomGif.url);
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    } catch (error) {
      console.error("Attack GIF error:", error);
      const embed = successEmbed(`${attack.emoji} ${attack.name}!`, `${attack.emoji} **${attackerName}** ${attack.verb} **${targetName}**!`);
      await InteractionHelper.safeEditReply(interaction, { embeds: [embed] });
    }
  },
};
