import { SlashCommandBuilder } from 'discord.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const OWNER_USER_ID = '1281977840648327292';

export default {
  data: new SlashCommandBuilder()
    .setName('commit')
    .setDescription('Show the currently deployed Git commit.')
    .setDefaultMemberPermissions('0'),

  category: 'Owner',

  async execute(interaction) {
    if (interaction.user.id !== OWNER_USER_ID) {
      return interaction.reply({ content: '❌ Owner only.', ephemeral: true });
    }

    try {
      const { stdout: sha } = await execFileAsync('git', ['rev-parse', 'HEAD']);
      const { stdout: subject } = await execFileAsync('git', ['log', '-1', '--pretty=%s']);

      return interaction.reply({
        content: `**Current Commit**\n\n🔹 **SHA:** \`${sha.trim()}\`\n📝 **Message:** ${subject.trim() || 'Unknown'}`,
        ephemeral: true,
      });
    } catch {
      return interaction.reply({
        content: '❌ Unable to read the current Git commit from this deployment.',
        ephemeral: true,
      });
    }
  },
};
