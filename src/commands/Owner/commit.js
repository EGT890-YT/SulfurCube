import { SlashCommandBuilder } from 'discord.js';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const OWNER_USER_ID = '1281977840648327292';

function getDeploymentCommit() {
  return (
    process.env.SULFURCUBE_GIT_COMMIT ||
    process.env.GIT_COMMIT_SHA ||
    process.env.SOURCE_COMMIT ||
    process.env.RAILWAY_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    ''
  ).trim();
}

function getDeploymentCommitMessage() {
  return (
    process.env.SULFURCUBE_GIT_COMMIT_MESSAGE ||
    process.env.GIT_COMMIT_MESSAGE ||
    'Deployment commit'
  ).trim();
}

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
      let sha = getDeploymentCommit();
      let subject = getDeploymentCommitMessage();

      // Local/non-container deployments can still use the Git repository directly.
      if (!sha) {
        const result = await execFileAsync('git', ['rev-parse', 'HEAD']);
        sha = result.stdout.trim();

        const log = await execFileAsync('git', ['log', '-1', '--pretty=%s']);
        subject = log.stdout.trim() || 'Unknown';
      }

      if (!sha) {
        throw new Error('No deployment commit is available.');
      }

      return interaction.reply({
        content: `**Current Commit**\n\n🔹 **SHA:** \`${sha}\`\n📝 **Message:** ${subject || 'Unknown'}`,
        ephemeral: true,
      });
    } catch {
      return interaction.reply({
        content: '❌ Unable to determine the current Git commit for this deployment.',
        ephemeral: true,
      });
    }
  },
};
