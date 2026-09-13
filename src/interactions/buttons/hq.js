import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { assertHQOwner, BOT_CLIENT_ID, DISCORD_BOT_ID, HQ_GUILD_ID } from '../../config/owner.js';
import botConfig from '../../config/bot.js';
import { getGuildConfig, updateGuildConfig } from '../../services/config/guildConfig.js';
import { createHqPanel } from '../../commands/Owner/hq.js';

function ownerOnlyReply(interaction) {
  return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
}

async function refreshPanel(interaction, client, selectedGuildId = null, page = 0, content = null) {
  const panel = createHqPanel(client, selectedGuildId, page);
  if (content) panel.content = content;

  if (interaction.deferred || interaction.replied) {
    return interaction.editReply(panel);
  }

  return interaction.update(panel);
}

export default [
  {
    name: 'hq_guild',
    async execute(interaction, client) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const selectedGuildId = interaction.values?.[0] ?? null;
      const guild = selectedGuildId ? client.guilds.cache.get(selectedGuildId) : null;
      if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });
      return interaction.update(createHqPanel(client, guild.id, 0));
    },
  },
  {
    name: 'hq_page',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      return interaction.update(createHqPanel(client, args[1] === 'none' ? null : args[1], Number(args[0]) || 0));
    },
  },
  {
    name: 'hq_refresh',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      return interaction.update(createHqPanel(client, args[1] === 'none' ? null : args[1], Number(args[0]) || 0));
    },
  },
  {
    name: 'hq_invite',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);

      // 1541748691063283742 is the bot user/application ID. 1281977840648327292
      // is the owner account and must never be used as the OAuth client_id.
      const inviteUrl = `https://discord.com/oauth2/authorize?client_id=${DISCORD_BOT_ID || BOT_CLIENT_ID}&scope=bot%20applications.commands&permissions=0`;

      try {
        await interaction.user.send(`🔗 **SulfurCube Bot Invite**\n\n${inviteUrl}`);
        return interaction.reply({ content: '📨 **Done!** I sent the bot invite to your DMs.', ephemeral: true });
      } catch {
        return interaction.reply({ content: '❌ I could not DM you the invite. Please make sure your DMs are open.', ephemeral: true });
      }
    },
  },
  {
    name: 'hq_maintenance_on',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      botConfig.commands.maintenanceMode = true;
      botConfig.commands.testingMode = false;
      return refreshPanel(interaction, interaction.client, null, 0, '🛠️ **Maintenance mode enabled.** Normal bot commands are now blocked.');
    },
  },
  {
    name: 'hq_maintenance_off',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = false;
      return refreshPanel(interaction, interaction.client, null, 0, '🟢 **Maintenance mode disabled.** Normal bot commands are available again.');
    },
  },
  {
    name: 'hq_testing',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      if (botConfig.commands.maintenanceMode !== true) {
        return interaction.reply({ content: '❌ Turn **Maintenance ON** first, then enable testing mode.', ephemeral: true });
      }
      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = true;
      return refreshPanel(interaction, interaction.client, null, 0, '🧪 **Testing mode enabled.** Normal commands are available for testing.');
    },
  },
  {
    name: 'hq_all_on',
    async execute(interaction, client) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);

      botConfig.commands.maintenanceMode = false;
      botConfig.commands.testingMode = false;

      const updates = [...client.guilds.cache.values()].map((guild) =>
        updateGuildConfig(client, guild.id, { botDisabled: false }, { source: 'owner.hq.all_on', userId: interaction.user.id }).catch(() => null),
      );
      await Promise.all(updates);
      return refreshPanel(interaction, client, null, 0, `✅ **SulfurCube is ON everywhere.** Cleared server shutdowns across **${client.guilds.cache.size}** server(s).`);
    },
  },
  {
    name: 'hq_all_off',
    async execute(interaction, client) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);

      const updates = [...client.guilds.cache.values()]
        .filter((guild) => guild.id !== HQ_GUILD_ID)
        .map((guild) =>
          updateGuildConfig(client, guild.id, { botDisabled: true }, { source: 'owner.hq.all_off', userId: interaction.user.id }).catch(() => null),
        );
      await Promise.all(updates);
      return refreshPanel(interaction, client, null, 0, `🔴 **SulfurCube is OFF everywhere except HQ.** Disabled **${updates.length}** server(s).`);
    },
  },
  {
    name: 'hq_server_on',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const guildId = args[0];
      if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Select a guild first.', ephemeral: true });
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });

      await updateGuildConfig(client, guildId, { botDisabled: false }, { source: 'owner.hq.server_on', userId: interaction.user.id });
      return refreshPanel(interaction, client, guildId, 0, `🟢 **SulfurCube is ON in ${guild.name}.**`);
    },
  },
  {
    name: 'hq_server_off',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const guildId = args[0];
      if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Select a guild first.', ephemeral: true });
      if (guildId === HQ_GUILD_ID) return interaction.reply({ content: '❌ I will not disable the HQ server.', ephemeral: true });
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });

      await updateGuildConfig(client, guildId, { botDisabled: true }, { source: 'owner.hq.server_off', userId: interaction.user.id });
      return refreshPanel(interaction, client, guildId, 0, `🔴 **SulfurCube is OFF in ${guild.name}.**`);
    },
  },
  {
    name: 'hq_message',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const guildId = interaction.customId.split(':')[1];
      if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Select a guild first.', ephemeral: true });
      const modal = new ModalBuilder().setCustomId(`hq_message:${guildId}`).setTitle('Message Guild');
      const input = new TextInputBuilder().setCustomId('message').setLabel('Message').setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(2000).setPlaceholder('Type the message to send...');
      modal.addComponents(new ActionRowBuilder().addComponents(input));
      return interaction.showModal(modal);
    },
  },
  {
    name: 'hq_leave',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const guildId = args[0];
      const page = Number(args[1]) || 0;
      if (!guildId || guildId === 'none' || guildId === HQ_GUILD_ID) return interaction.reply({ content: '❌ I will not leave the HQ guild.', ephemeral: true });
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });
      const name = guild.name;
      await guild.leave();
      return interaction.update({ ...createHqPanel(client, null, page), content: `🚪 Left **${name}**.` });
    },
  },
  {
    name: 'hq_ownerrole',
    async execute(interaction, client) {
      if (!assertHQOwner(interaction)) return ownerOnlyReply(interaction);
      const guildId = interaction.customId.split(':')[1];
      if (!guildId || guildId === 'none') return interaction.reply({ content: '❌ Select a guild first.', ephemeral: true });
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return interaction.reply({ content: '❌ That guild is no longer available.', ephemeral: true });

      await interaction.deferReply({ ephemeral: true });
      const me = guild.members.me ?? await guild.members.fetchMe();
      if (!me.permissions.has('ManageRoles')) return interaction.editReply(`❌ I need **Manage Roles** in **${guild.name}**.`);

      const botHighest = me.roles.highest;
      if (!botHighest || botHighest.position <= 1) return interaction.editReply(`❌ My highest role is too low in **${guild.name}** to create a separate owner role above other roles.`);

      let role = guild.roles.cache.find((r) => r.name === 'SulfurCube Owner' && !r.managed);
      if (!role) role = await guild.roles.create({ name: 'SulfurCube Owner', reason: 'SulfurCube owner role requested by the bot owner' });

      const targetPosition = Math.max(1, botHighest.position - 1);
      await role.setPosition(targetPosition, 'SulfurCube owner role requested by the bot owner');

      const owner = await guild.members.fetch(interaction.user.id);
      if (!owner.roles.cache.has(role.id)) await owner.roles.add(role, 'SulfurCube owner role requested by the bot owner');

      return interaction.editReply(`👑 Done in **${guild.name}**. I gave you **${role.name}** and placed it at the highest position I can manage.`);
    },
  },
];
