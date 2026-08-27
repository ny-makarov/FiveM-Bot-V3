"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const base_1 = require("../../base");
const discord_js_1 = require("discord.js");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
const core_1 = require("@magicyan/core");
const discord_1 = require("@magicyan/discord");
const discord_js_2 = require("discord.js");
const settings_1 = require("../../../settings");
dotenv_1.default.config();
new base_1.Event({
    name: "ready",
    async run(client) {
        if (!process.env.CANAL_TICKETID) {
            console.error('Channel ID not provided in the environment variable.');
            return;
        }
        try {
            const channel = await client.channels.fetch(process.env.CANAL_TICKETID);
            if (channel instanceof discord_js_1.TextChannel) {
                await sendTicketMessage(channel);
                client.on("messageDelete", async (deletedMessage) => {
                    if (deletedMessage.id === process.env.CANAL_TICKETID) {
                        await sendTicketMessage(channel);
                    }
                });
                client.on("messageDelete", async (deletedMessage) => {
                    if (deletedMessage.id === process.env.CANAL_TICKETID) {
                        await sendTicketMessage(channel);
                    }
                });
            }
            else {
                console.error('Canal inexistente');
            }
        }
        catch (error) {
            console.error('Error fetching channel:', error);
        }
    }
});
async function sendTicketMessage(channel) {
    try {
        await channel.bulkDelete(100, true);
    }
    catch (error) {
        console.error('Error deleting messages:', error);
    }
    const embed = new discord_js_1.EmbedBuilder({
        title: "Sistema de Ticket Automático",
        description: "Para obter **AJUDA** abra um ticket selecionando um item\n no menu abaixo abra um ticket, após aberto aguardar.",
        color: (0, core_1.hexToRgb)(settings_1.settings.colors.theme.default),
        footer: {
            text: "Lembre-se não abra um ticket sem necessidade",
        },
        thumbnail: {
            url: process.env.LOGO ?? ""
        },
        image: {
            url: process.env.BANNERTK ?? "",
        }
    });
    const row = (0, discord_1.createRow)(new discord_js_2.StringSelectMenuBuilder({
        customId: "selecao-tickets",
        placeholder: "Selecione uma opção de abertura",
        options: [
            {
                label: "Duvidas",
                value: "Duvidas",
                description: "Abrir ticket relacionado a Duvidas",
                emoji: "❓",
            },
            {
                label: "Doações",
                value: "Doações",
                description: "Abrir ticket relacionado a Doações",
                emoji: "🎁",
            },
            {
                label: "Denuncias",
                value: "Denuncias",
                description: "Abrir ticket relacionado a Denuncias",
                emoji: "🚫",
            },
            {
                label: "Suporte",
                value: "Suporte",
                description: "Abrir ticket relacionado a Suporte",
                emoji: "🪛",
            },
        ],
    }));
    try {
        await channel.send({ embeds: [embed], components: [row], ephemeral: false });
    }
    catch (error) {
        console.error('Error sending message:', error);
    }
}
