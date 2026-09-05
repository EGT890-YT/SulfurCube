# SulfurCube

SulfurCube is a Discord.js v14 community bot with moderation, utility, fun, economy, tickets, giveaways, music, and server-management features.

## SulfurCube HQ

The official HQ guild is **Soverign SMP**.

- HQ Guild ID: `1473773901753618580`
- Owner-only HQ tools are restricted to the configured bot owner.
- The HQ panel can show the guilds SulfurCube is currently in and provides safe per-guild controls such as messaging a selected guild, leaving a selected guild, refreshing the list, and generating an invite link.

## Owner Controls

- `/bot on` — turn the bot on immediately.
- `/bot off` — put the bot into maintenance mode immediately; non-owner commands are blocked.
- `/bot status` — show the current state.
- `/hq` — open the owner HQ panel in the HQ server.
- The HQ **Owner Role** button only acts when explicitly pressed. It creates/reuses one `SulfurCube Owner` role, moves it to the highest position the bot can manage, and gives that role to the owner. It does not modify or assign every existing role.

## Fun Protection

The bot owner is protected from `/attack`. Other fun interactions such as `/hug` and `/ship` are not disabled by that protection.

## Setup

Requires Node.js 20.10.0+ and the Discord bot environment variables used by the project, including `DISCORD_TOKEN` and `CLIENT_ID`.

```bash
npm install
npm start
```

## Discord Permissions

SulfurCube needs the permissions required by the features you enable. In particular, the owner-role feature needs **Manage Roles**. Discord's role hierarchy means a bot can only manage roles below its own highest role.

## Note about the original template

The project code and package metadata have been rebranded for SulfurCube. GitHub's repository-level fork relationship, if this repository is still marked as a fork, is GitHub metadata and is not removed by changing source files.
