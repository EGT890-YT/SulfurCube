import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from 'discord.js';
import { assertHQOwner, HQ_GUILD_ID } from '../../config/owner.js';
import { createHqPanel } from '../../commands/Owner/hq.js';

export default [
  {
    name: 'hq_page',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
      return interaction.update(createHqPanel(client, args[1] === 'none' ? null : args[1], Number(args[0]) || 0));
    },
  },
  {
    name: 'hq_refresh',
    async execute(interaction, client, args) {
      if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
      return interaction.update(createHqPanel(client, args[1] === 'none' ? null : args[1], Number(args[0]) || 0));
    },
  },
  {
    name: 'hq_message',
    async execute(interaction) {
      if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
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
      if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
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
      if (!assertHQOwner(interaction)) return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
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

      return interaction.editReply(`👑 Done in **${guild.name}**. I gave you **${role.name}** and placed it at the highest position I can manage. I did not grant or modify any other roles.`);
    },
  },
];
