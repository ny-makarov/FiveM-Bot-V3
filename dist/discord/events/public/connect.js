"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const base_1 = require("../../base");
const discord_js_1 = require("discord.js");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const FiveM = require("fivem-server-api");
dotenv_1.default.config();
const server = new FiveM.Server(process.env.IP_SERVIDOR);
new base_1.Event({
    name: "ready",
    async run(client) {
        if (!process.env.CANAL_CONNECTID) {
            console.error('Channel ID not provided in the environment variable.');
            return;
        }
        try {
            const channel = await client.channels.fetch(process.env.CANAL_CONNECTID);
            if (channel instanceof discord_js_1.TextChannel) {
                await sendConnectMessage(channel);
                client.on("messageDelete", async (deletedMessage) => {
                    if (deletedMessage.id === process.env.CANAL_CONNECTID) {
                        await sendConnectMessage(channel);
                    }
                });
                setInterval(async () => {
                    await sendConnectMessage(channel);
                }, 100000);
            }
            else {
                console.error('Channel does not exist');
            }
        }
        catch (error) {
            console.error('Error fetching channel:', error);
        }
    }
});
async function sendConnectMessage(channel) {
    try {
        await channel.bulkDelete(10, true);
    }
    catch (error) {
        console.error('Error deleting messages:', error);
    }
    try {
        const timeoutPromise = new Promise((resolve) => {
            setTimeout(() => resolve({ status: "🔴Offline", players: "[0/0]" }), 3000);
        });
        const serverStatus = await Promise.race([checkServerConnection(), timeoutPromise]);
        let embed = new discord_js_1.EmbedBuilder({
            title: process.env.TITULO,
            thumbnail: {
                url: process.env.LOGO ?? "Link not provided"
            },
            timestamp: new Date().toISOString(),
            footer: {
                text: "Atualizado a cada 2 minutos | Ultima atualização"
            },
            image: {
                url: process.env.BANNERCONNECT ?? "Link not provided",
            },
            fields: [
                {
                    name: "> __**Status:**__",
                    value: `**\`\`\`yaml\n${serverStatus.status}\`\`\`**`,
                    inline: true
                },
                {
                    name: "> __**Players:**__",
                    value: `**\`\`\`ini\n${serverStatus.players}\`\`\`**`,
                    inline: true
                },
                {
                    name: "> __**IP FiveM:**__",
                    value: `**\`\`\`fix\n${process.env.IP_SERVER ?? "Not defined"}\`\`\`**`
                }
            ]
        });
        const row = new discord_js_1.ActionRowBuilder({ components: [
                new discord_js_1.ButtonBuilder({
                    url: process.env.FIVEMURL,
                    label: "Conectar-se",
                    style: discord_js_1.ButtonStyle.Link,
                    emoji: "<:icons8meuscinco48:1366072726732935300>"
                }),
                new discord_js_1.ButtonBuilder({
                    url: process.env.LOJAURL,
                    label: "Acesse a Loja",
                    style: discord_js_1.ButtonStyle.Link,
                    emoji: "<:icons8loja40:1366072744864911412>"
                }),
                new discord_js_1.ButtonBuilder({
                    url: process.env.TIKTOKURL,
                    label: "TikTok",
                    style: discord_js_1.ButtonStyle.Link,
                    emoji: "<:icons8tiktok50:1366072758349598782>"
                }),
            ] });
        await channel.send({ embeds: [embed], components: [row] });
    }
    catch (error) {
        console.error('Error sending message:', error);
    }
}
async function checkServerConnection() {
    try {
        const isConnected = await server.getServerStatus();
        let playersInfo = "Error Occured";
        if (isConnected) {
            const players = await server.getPlayers();
            if (players !== "Error Occured") {
                const maxPlayers = await server.getMaxPlayers();
                playersInfo = `[${players}/${maxPlayers}]`;
            }
            else {
                playersInfo = "[0/0]";
            }
        }
        const status = playersInfo === "[0/0]" ? "Offline" : isConnected ? "🟢Online" : "🔴Offline";
        return { status, players: playersInfo };
    }
    catch (error) {
        console.error('Error checking server connection:', error);
        return { status: "🔴Offline", players: "[0/0]" };
    }
}
