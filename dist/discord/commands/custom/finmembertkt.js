"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const base_1 = require("../../base");
const discord_html_transcripts_1 = require("discord-html-transcripts");
const discord_js_1 = require("discord.js");
const fs = tslib_1.__importStar(require("fs"));
const path = tslib_1.__importStar(require("path"));
const BUTTON_IDS = {
    FINALIZE: "finalizar-ticket",
    TRANSCRIPT: "acessar-transcrip",
    CONFIRM_YES: "confirm-yes",
    CONFIRM_NO: "confirm-no",
    RATE_SERVICE: "rate-service"
};
new base_1.Component({
    customId: BUTTON_IDS.FINALIZE,
    type: discord_js_1.ComponentType.Button,
    cache: "cached",
    async run(interaction) {
        try {
            if (!interaction.guild) {
                console.error('Canal inexistente!');
                return;
            }
            const member = await interaction.guild.members.fetch(interaction.user);
            if (!member.roles.cache.has(process.env.CARGO_STAFF ?? "")) {
                await interaction.reply({ ephemeral: true, content: "Somente atendentes podem usar esse botão" });
                return;
            }
            if (interaction.member && 'id' in interaction.member) {
                const memberId = interaction.member.id;
                const logChannelId = process.env.CANAL_TRANSCRIPT ?? "";
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (!logChannel) {
                    console.error('Canal de log inexistente!');
                    return;
                }
                const logEmbed = new discord_js_1.EmbedBuilder({
                    title: ('Deseja Finalizar o ticket?\nAo fechar o ticket será gerado o transcript'),
                    thumbnail: {
                        url: process.env.LOGO ?? ""
                    },
                    description: "Clique em um dos botões abaixo para confirmar sua escolha:",
                    timestamp: new Date().toISOString(),
                    footer: {
                        text: "Sistema de ticket byRomeraSCR"
                    },
                });
                const actionRow = new discord_js_1.ActionRowBuilder({
                    components: [
                        new discord_js_1.ButtonBuilder({
                            customId: BUTTON_IDS.CONFIRM_YES,
                            label: "Sim",
                            style: discord_js_1.ButtonStyle.Success,
                        }),
                        new discord_js_1.ButtonBuilder({
                            customId: BUTTON_IDS.CONFIRM_NO,
                            label: "Não",
                            style: discord_js_1.ButtonStyle.Danger,
                        })
                    ],
                });
                const message = await interaction.reply({
                    content: "byRomeraSCR - Cancelar ticketc",
                    components: [actionRow],
                    embeds: [logEmbed],
                });
                const collector = interaction.channel?.createMessageComponentCollector({ time: 15000 });
                collector?.on('collect', async (buttonInteraction) => {
                    if (buttonInteraction.user.id === memberId) {
                        try {
                            if (buttonInteraction.customId === BUTTON_IDS.CONFIRM_YES) {
                                await buttonInteraction.deferReply({ ephemeral: true });
                                const channel = buttonInteraction.channel;
                                const transcriptBuffer = await (0, discord_html_transcripts_1.createTranscript)(channel, {
                                    returnType: discord_html_transcripts_1.ExportReturnType.Buffer,
                                });
                                const transcriptAttachment = new discord_js_1.AttachmentBuilder(transcriptBuffer, {
                                    name: `transcript-${buttonInteraction.channelId}.html`,
                                });
                                const transcriptUrl = await saveTranscript(transcriptBuffer, buttonInteraction.channelId);
                                await logChannel.send({ files: [transcriptAttachment] });
                                const ticketCreator = channel.topic;
                                if (ticketCreator) {
                                    try {
                                        const user = await buttonInteraction.client.users.fetch(ticketCreator);
                                        if (user) {
                                            const dmEmbed = new discord_js_1.EmbedBuilder({
                                                title: "Ticket Fechado",
                                                description: `Seu ticket foi fechado por ${buttonInteraction.user.tag}`,
                                                color: 0x2F3136,
                                                timestamp: new Date().toISOString(),
                                                footer: {
                                                    text: "Sistema de ticket byRomeraSCR"
                                                }
                                            });
                                            const dmActionRow = new discord_js_1.ActionRowBuilder({
                                                components: [
                                                    new discord_js_1.ButtonBuilder({
                                                        url: transcriptUrl,
                                                        label: "Acessar Transcript",
                                                        style: discord_js_1.ButtonStyle.Link,
                                                        emoji: "📄"
                                                    }),
                                                    new discord_js_1.ButtonBuilder({
                                                        customId: BUTTON_IDS.RATE_SERVICE,
                                                        label: "Avaliar Atendimento",
                                                        style: discord_js_1.ButtonStyle.Success,
                                                        emoji: "⭐"
                                                    })
                                                ]
                                            });
                                            await user.send({
                                                embeds: [dmEmbed],
                                                components: [dmActionRow]
                                            });
                                        }
                                    }
                                    catch (error) {
                                        console.error("Erro ao enviar DM:", error);
                                    }
                                }
                                await buttonInteraction.editReply({ content: "Ticket finalizado com sucesso!" });
                                closeTicket(buttonInteraction);
                            }
                            else if (buttonInteraction.customId === BUTTON_IDS.CONFIRM_NO) {
                                await buttonInteraction.deferReply({ ephemeral: true });
                                await buttonInteraction.editReply({ content: "A Finalização do Ticket foi cancelado!" });
                            }
                        }
                        catch (error) {
                            console.error("Erro ao processar interação:", error);
                            try {
                                if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                                    await buttonInteraction.reply({ content: "Ocorreu um erro ao processar sua solicitação.", ephemeral: true });
                                }
                                else {
                                    await buttonInteraction.editReply({ content: "Ocorreu um erro ao processar sua solicitação." });
                                }
                            }
                            catch (e) {
                                console.error("Erro ao enviar mensagem de erro:", e);
                            }
                        }
                        collector.stop();
                    }
                });
                collector?.on('end', async () => {
                    try {
                        const components = [actionRow];
                        components[0].components.forEach(button => button.setDisabled(true));
                        await message.edit({ components }).catch(() => { });
                    }
                    catch (error) {
                        console.error('Erro ao atualizar mensagem:', error);
                    }
                });
            }
        }
        catch (error) {
            console.error("Erro ao finalizar o ticket:", error);
        }
    }
});
async function saveTranscript(transcript, ticketId) {
    const transcriptPath = path.join(process.env.PATH_TRANSCRIPT ?? "", `transcript-${ticketId}.html`);
    await fs.promises.writeFile(transcriptPath, transcript);
    return `${process.env.URL_TRANSCRIPT}/transcript-${ticketId}.html`;
}
async function sendTicketClosedDM(interaction, transcriptUrl) {
    try {
        const channel = interaction.channel;
        const topic = channel && "topic" in channel ? channel.topic : null;
        const ticketCreator = topic?.match(/<@(\d+)>/)?.[1];
        if (!ticketCreator)
            return;
        const user = await interaction.client.users.fetch(ticketCreator);
        if (!user)
            return;
        const dmEmbed = new discord_js_1.EmbedBuilder({
            title: "Ticket Fechado",
            description: `Seu ticket foi fechado por ${interaction.user.tag}`,
            color: 0x2F3136,
            timestamp: new Date().toISOString(),
            footer: {
                text: "Sistema de ticket byRomeraSCR"
            }
        });
        const actionRow = new discord_js_1.ActionRowBuilder({
            components: [
                new discord_js_1.ButtonBuilder({
                    url: transcriptUrl,
                    label: "Acessar Transcript",
                    style: discord_js_1.ButtonStyle.Link,
                    emoji: "📄"
                }),
                new discord_js_1.ButtonBuilder({
                    customId: BUTTON_IDS.RATE_SERVICE,
                    label: "Avaliar Atendimento",
                    style: discord_js_1.ButtonStyle.Success,
                    emoji: "⭐"
                })
            ]
        });
        await user.send({
            embeds: [dmEmbed],
            components: [actionRow]
        });
    }
    catch (error) {
        console.error("Erro ao enviar DM:", error);
    }
}
function closeTicket(interaction) {
    try {
        const channel = interaction.guild?.channels.cache.get(process.env.CANAL_LOG_TKT ?? "");
        if (interaction.channel instanceof discord_js_1.TextChannel && interaction.channel.name) {
            const transcriptUrl = `${process.env.URL_TRANSCRIPT}/transcript-${interaction.channelId}.html`;
            const logEmbed = new discord_js_1.EmbedBuilder({
                title: (`Ticket  #${interaction.channel?.name}  Fechado com Transcript`),
                thumbnail: {
                    url: process.env.LOGO ?? ""
                },
                description: `O Ticket foi fechado por <@${interaction.user.id}> **com transcript.**\nPara acessar o Transcript basta clicar no botão!`,
                timestamp: new Date().toISOString(),
                footer: {
                    text: "Sistema de ticket byRomeraSCR"
                },
            });
            const actionRow = new discord_js_1.ActionRowBuilder({
                components: [
                    new discord_js_1.ButtonBuilder({
                        url: transcriptUrl,
                        label: "Acessar Transcript",
                        emoji: "📄",
                        style: discord_js_1.ButtonStyle.Link,
                    })
                ],
            });
            channel.send({ embeds: [logEmbed], components: [actionRow] }).catch(console.error);
        }
        else {
            console.error('Canal de log inexistente');
        }
        interaction.channel?.delete().catch(console.error);
    }
    catch (error) {
        console.error("Erro ao fechar ticket:", error);
    }
}
