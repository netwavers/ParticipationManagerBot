require('dotenv').config();

const { Client, GatewayIntentBits, Events, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const gameManager = require('./gameManager');
const api = require('./api');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

client.once(Events.ClientReady, c => {
    console.log(`Ready! Logged in as ${c.user.tag}`);
    api.startServer();
});


client.on(Events.MessageCreate, message => {
    if (message.author.bot) return;

    const content = message.content.trim();

    // Natural Language Join
    if (content.includes('参加希望')) {
        let playerName = message.member ? message.member.displayName : message.author.username;
        const result = gameManager.addPlayer(message.author.id, playerName);
        if (result.success) {
            message.reply(`${playerName} さんを待機リストに追加しました！現在の待ち人数: ${result.queueLength}人`);
        } else {
            message.reply(result.message);
        }
        return;
    }

    // Natural Language Leave
    if (content.includes('参加辞退')) {
        const result = gameManager.removePlayer(message.author.id);
        if (result.success) {
            message.reply(`${result.name} さんを待機リストから削除しました。残り待ち人数: ${result.queueLength}人`);
        } else {
            message.reply(result.message);
        }
        return;
    }

    const args = content.split(' ');
    const command = args[0].toLowerCase();

    // !join [name]
    if (command === '!join') {
        let playerName = args.slice(1).join(' ');
        if (!playerName) {
            playerName = message.member ? message.member.displayName : message.author.username;
        }

        const result = gameManager.addPlayer(message.author.id, playerName);
        if (result.success) {
            message.reply(`${playerName} さんを待機リストに追加しました！現在の待ち人数: ${result.queueLength}人`);
        } else {
            message.reply(result.message);
        }
        return;
    }

    // !leave
    if (command === '!leave') {
        const result = gameManager.removePlayer(message.author.id);
        if (result.success) {
            message.reply(`${result.name} さんを待機リストから削除しました。残り待ち人数: ${result.queueLength}人`);
        } else {
            message.reply(result.message);
        }
        return;
    }

    // !list
    if (command === '!list') {
        const queue = gameManager.getQueue();
        if (queue.length === 0) {
            message.reply('現在の待機人数: 0人');
            return;
        }
        const listStr = queue.map((p, i) => `${i + 1}. ${p.name} (Play Count: ${p.playCount || 0})`).join('\n');
        message.reply(`現在の待機人数: ${queue.length}人\n\`\`\`\n${listStr}\n\`\`\``);
        return;
    }

    // !next [size]
    if (command === '!next') {
        const size = parseInt(args[1]) || 1; // Default to 1 if not specified
        const result = gameManager.pickSession(size);
        if (result.success) {
            const names = result.players.map(p => p.name).join(', ');
            message.reply(`セッションを開始します！選出されたプレイヤー: ${names}`);
        } else {
            message.reply(result.message);
        }
        return;
    }

    // !session
    if (command === '!session') {
        const session = gameManager.getSession();
        if (session.length === 0) {
            message.reply('現在進行中のセッションはありません。');
            return;
        }
        const names = session.map(p => p.name).join(', ');
        message.reply(`現在のセッション: ${names}`);
        return;
    }

    // !finish
    if (command === '!finish') {
        const result = gameManager.finishSession();
        if (result.success) {
            message.reply('セッションを終了しました。お疲れ様でした！');
        } else {
            message.reply(result.message);
        }
        return;
    }

    // !reset
    if (command === '!reset') {
        gameManager.reset();
        message.reply('待機リストとセッションをリセットしました。');
        return;
    }

    // !ping
    if (command === '!ping') {
        message.reply('Pong!');
        return;
    }

    // !help
    if (command === '!help') {
        const helpMessage = `
**コマンド一覧**
\`!join [名前]\`: 待機リストに参加します。名前を省略するとDiscordの表示名が使用されます。
\`!leave\`: 待機リストから辞退します。
\`!list\`: 現在の待機リストを表示します。
\`!next [人数]\`: 次のセッションを開始し、指定した人数（デフォルト1人）をリストから選出します。
\`!session\`: 現在進行中のセッションのプレイヤーを表示します。
\`!finish\`: 現在のセッションを終了します。
\`!reset\`: 待機リストとセッションをリセットします。
\`!panel\`: 操作パネルを表示します。
\`!recruit [募集文]\`: 募集文を設定して操作パネルを表示します。
\`!help\`: このヘルプを表示します。

**その他の機能**
- 「参加希望」を含むメッセージ: 待機リストに参加します。
- 「参加辞退」を含むメッセージ: 待機リストから辞退します。
`;
        message.reply(helpMessage);
        return;
    }

    // !panel
    if (command === '!panel') {
        const queue = gameManager.getQueue();
        const session = gameManager.getSession();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Participation Manager')
            .setDescription(gameManager.getRecruitmentMessage() || 'ボタンを押して操作してください。')
            .addFields(
                { name: '待機人数', value: `${queue.length}人`, inline: true },
                { name: 'セッション中', value: `${session.length}人`, inline: true },
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_queue')
                    .setLabel('参加')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('leave_queue')
                    .setLabel('辞退')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('refresh_panel')
                    .setLabel('更新')
                    .setStyle(ButtonStyle.Secondary),
            );

        message.channel.send({ embeds: [embed], components: [row] });
        return;
    }

    // !recruit [message]
    if (command === '!recruit') {
        const recruitMsg = args.slice(1).join(' ');
        if (!recruitMsg) {
            message.reply('募集内容を入力してください。例: `!recruit ランクマ募集 @3`');
            return;
        }

        gameManager.setRecruitmentMessage(recruitMsg);

        // Show panel (same logic as !panel)
        const queue = gameManager.getQueue();
        const session = gameManager.getSession();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Participation Manager')
            .setDescription(recruitMsg)
            .addFields(
                { name: '待機人数', value: `${queue.length}人`, inline: true },
                { name: 'セッション中', value: `${session.length}人`, inline: true },
            )
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('join_queue')
                    .setLabel('参加')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('leave_queue')
                    .setLabel('辞退')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('refresh_panel')
                    .setLabel('更新')
                    .setStyle(ButtonStyle.Secondary),
            );

        message.channel.send({ embeds: [embed], components: [row] });
        return;
    }
});

client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const { customId } = interaction;

    if (customId === 'join_queue') {
        let playerName = interaction.member ? interaction.member.displayName : interaction.user.username;
        const result = gameManager.addPlayer(interaction.user.id, playerName);

        if (result.success) {
            await interaction.reply({ content: `${playerName} さんを待機リストに追加しました！現在の待ち人数: ${result.queueLength}人`, ephemeral: true });
        } else {
            await interaction.reply({ content: result.message, ephemeral: true });
        }
    } else if (customId === 'leave_queue') {
        const result = gameManager.removePlayer(interaction.user.id);

        if (result.success) {
            await interaction.reply({ content: `${result.name} さんを待機リストから削除しました。残り待ち人数: ${result.queueLength}人`, ephemeral: true });
        } else {
            await interaction.reply({ content: result.message, ephemeral: true });
        }
    } else if (customId === 'refresh_panel') {
        const queue = gameManager.getQueue();
        const session = gameManager.getSession();

        const embed = new EmbedBuilder()
            .setColor(0x0099FF)
            .setTitle('Participation Manager')
            .setDescription(gameManager.getRecruitmentMessage() || 'ボタンを押して操作してください。')
            .addFields(
                { name: '待機人数', value: `${queue.length}人`, inline: true },
                { name: 'セッション中', value: `${session.length}人`, inline: true },
            )
            .setTimestamp();

        await interaction.update({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
