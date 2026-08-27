"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const base_1 = require("../../base");
const settings_1 = require("../../../settings");
const core_1 = require("@magicyan/core");
const discord_1 = require("@magicyan/discord");
const discord_js_1 = require("discord.js");
const BUTTON_IDS = { POKAR: "pokar-ticket" };
new base_1.Component({
    customId: BUTTON_IDS.POKAR,
    type: discord_js_1.ComponentType.Button,
    cache: "cached",
    async run(interaction) {
        try {
            const { user, channel } = interaction;
            if (!interaction.guild || !channel) {
                console.error('Guilda ou canal inexistente!');
                return;
            }
            const member = await interaction.guild.members.fetch(interaction.user);
            if (!member.roles.cache.has(process.env.CARGO_STAFF ?? "")) {
                await interaction.reply({ ephemeral: true, content: "Somente atendentes podem usar esse botão" });
                return;
            }
            const textChannel = channel;
            const members = textChannel.members;
            if (!members) {
                console.error('Não foi possível obter os membros do canal.');
                return;
            }
            const embed = new discord_js_1.EmbedBuilder({
                title: "Sistema de Alertar Membro",
                description: "Selecione o Membro a ser alertado",
                color: (0, core_1.hexToRgb)(settings_1.settings.colors.theme.default),
                footer: {
                    text: "Lembre-se não use sem necessidade",
                },
                thumbnail: {
                    url: process.env.LOGO ?? ""
                },
            });
            const selectMenuOptions = members.map(member => ({
                label: member.displayName,
                value: member.id,
                description: "Alertar Membro de ticket aberto",
                emoji: "⚠️",
            }));
            const row = (0, discord_1.createRow)(new discord_js_1.StringSelectMenuBuilder({
                customId: "selecao-pokar",
                placeholder: "Selecione um player para notificar",
                options: selectMenuOptions,
            }));
            const message = await textChannel.send({ embeds: [embed], components: [row] });
            interaction.reply({ ephemeral: true, content: "Menu de alerta enviado." });
            interaction.client.on("interactionCreate", async (interaction) => {
                if (!interaction.isStringSelectMenu())
                    return;
                if (interaction.customId === "selecao-pokar") {
                    const selectedMemberId = interaction.values[0];
                    const selectedMember = await interaction.guild?.members.fetch(selectedMemberId);
                    const embed = new discord_js_1.EmbedBuilder({
                        title: "Alerta de Ticket Aberto",
                        description: "Você está sendo notificado em um ticket\nFavor acessar o discord para ser tratado!",
                        color: (0, core_1.hexToRgb)(settings_1.settings.colors.theme.default),
                        footer: {
                            text: "byRomeraSCR",
                        },
                        thumbnail: {
                            url: process.env.LOGO ?? ""
                        },
                    });
                    await selectedMember?.send({ embeds: [embed] });
                    await message.delete();
                    await interaction.reply({ content: 'Alerta enviado para o membro selecionado.', ephemeral: true });
                }
            });
        }
        catch (error) {
            console.error("Erro ao enviar mensagem direta:", error);
        }
    }
});
