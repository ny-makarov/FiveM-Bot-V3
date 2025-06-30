import { Component, Modal } from "@/discord/base";
import { reply } from "@/functions";
import { settings } from "@/settings";
import { brBuilder, createModalInput, hexToRgb } from "@magicyan/discord";
import { createTranscript } from "discord-html-transcripts";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChannelType,
  ComponentType,
  EmbedBuilder,
  TextChannel,
  ModalBuilder,
  GuildMember,
  TextInputStyle,
} from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

const BUTTON_IDS = { 
  FINALIZE: "finalizar-ticket",
  TRANSCRIPT: "acessar-transcrip",
  CONFIRM_YES: "confirm-yes",
  CONFIRM_NO: "confirm-no",
  RATE_SERVICE: "rate-service"
}

new Component({
  customId: BUTTON_IDS.FINALIZE,
  type: ComponentType.Button,
  cache: "cached",
  async run(interaction) {
    try {
  
      if (!interaction.guild) {
        console.error('Canal inexistente!');
        return;
      }

      const member: GuildMember = await interaction.guild.members.fetch(interaction.user);
      if (!member.roles.cache.has(process.env.CARGO_STAFF ??"")) {
          await interaction.reply({ ephemeral: true, content: "Somente atendentes podem usar esse botão"});
          return;
      }

      if (interaction.member && 'id' in interaction.member) {
        const memberId = interaction.member.id;

        const logEmbed = new EmbedBuilder({
          title:('Deseja Finalizar o ticket?\nAo fechar o ticket será gerado o transcript'),
          thumbnail: {
            url: process.env.LOGO ?? ""
          },
          description: "Clique em um dos botões abaixo para confirmar sua escolha:",
          timestamp: new Date().toISOString(),
          footer: {
            text: "Sistema de ticket byRomeraSCR"
          },
        });
        
        const actionRow = new ActionRowBuilder<ButtonBuilder>({
          components: [
            new ButtonBuilder({
              customId: BUTTON_IDS.CONFIRM_YES,
              label: "Sim",
              style: ButtonStyle.Success,
            }),
            new ButtonBuilder({
              customId: BUTTON_IDS.CONFIRM_NO,
              label: "Não",
              style: ButtonStyle.Danger,
            })
          ],
        });

        const message = await interaction.reply({
          content: "byRomeraSCR - Cancelar ticketc",
          components: [actionRow],
          embeds: [logEmbed],
        });
       
        const collector = interaction.channel?.createMessageComponentCollector({ time: 15000 });
        collector?.on('collect', async (interaction: ButtonInteraction) => {
          if (interaction.user.id === memberId) {
            try {
              if (interaction.customId === BUTTON_IDS.CONFIRM_YES) {
                await interaction.deferReply({ ephemeral: true });
                
                const transcript = await createTranscript(interaction.channel as TextChannel, {
                  returnBuffer: true
                });
                const transcriptUrl = await saveTranscript(transcript, interaction.channelId);
                await logChannel.send({ files: [transcript] });
                
                // Get ticket creator from channel topic
                const ticketCreator = interaction.channel?.topic;
                if (ticketCreator) {
                  try {
                    const user = await interaction.client.users.fetch(ticketCreator);
                    if (user) {
                      const dmEmbed = new EmbedBuilder({
                        title: "Ticket Fechado",
                        description: `Seu ticket foi fechado por ${interaction.user.tag}`,
                        color: 0x2F3136,
                        timestamp: new Date().toISOString(),
                        footer: {
                          text: "Sistema de ticket byRomeraSCR"
                        }
                      });

                      const actionRow = new ActionRowBuilder<ButtonBuilder>({
                        components: [
                          new ButtonBuilder({
                            url: transcriptUrl,
                            label: "Acessar Transcript",
                            style: ButtonStyle.Link,
                            emoji: "📄"
                          }),
                          new ButtonBuilder({
                            customId: BUTTON_IDS.RATE_SERVICE,
                            label: "Avaliar Atendimento",
                            style: ButtonStyle.Success,
                            emoji: "⭐"
                          })
                        ]
                      });

                      await user.send({
                        embeds: [dmEmbed],
                        components: [actionRow]
                      });
                    }
                  } catch (error) {
                    console.error("Erro ao enviar DM:", error);
                  }
                }
                
                await interaction.editReply({ content: "Ticket finalizado com sucesso!" });
                closeTicket(interaction);
              } else if (interaction.customId === BUTTON_IDS.CONFIRM_NO) {
                await interaction.deferReply({ ephemeral: true });
                await interaction.editReply({ content: "A Finalização do Ticket foi cancelado!" });
              }
            } catch (error) {
              console.error("Erro ao processar interação:", error);
              try {
                if (!interaction.replied && !interaction.deferred) {
                  await interaction.reply({ content: "Ocorreu um erro ao processar sua solicitação.", ephemeral: true });
                } else {
                  await interaction.editReply({ content: "Ocorreu um erro ao processar sua solicitação." });
                }
              } catch (e) {
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
            await message.edit({ components }).catch(() => {});
          } catch (error) {
            console.error('Erro ao atualizar mensagem:', error);
          }
        });

      } 

      const logChannelId = process.env.CANAL_TRANSCRIPT ?? ""; 
      const logChannel = interaction.guild.channels.cache.get(logChannelId) as TextChannel;
      if (!logChannel) {
        console.error('Canal de log inexistente!');
        return;
      }
    } catch (error) {
      console.error("Erro ao finalizar o ticket:", error);
    }
  }
});

async function saveTranscript(transcript: any, ticketId: string): Promise<string> {
  const transcriptPath = path.join(process.env.PATH_TRANSCRIPT ?? "", `transcript-${ticketId}.html`);
  const buffer = Buffer.from(await transcript.attachment.toString());
  await fs.promises.writeFile(transcriptPath, buffer);
  return `${process.env.URL_TRANSCRIPT}/transcript-${ticketId}.html`;
}

async function sendTicketClosedDM(interaction: ButtonInteraction, transcriptUrl: string) {
  try {
    const ticketCreator = interaction.channel?.topic?.match(/<@(\d+)>/)?.[1];
    if (!ticketCreator) return;

    const user = await interaction.client.users.fetch(ticketCreator);
    if (!user) return;

    const dmEmbed = new EmbedBuilder({
      title: "Ticket Fechado",
      description: `Seu ticket foi fechado por ${interaction.user.tag}`,
      color: 0x2F3136,
      timestamp: new Date().toISOString(),
      footer: {
        text: "Sistema de ticket byRomeraSCR"
      }
    });

    const actionRow = new ActionRowBuilder<ButtonBuilder>({
      components: [
        new ButtonBuilder({
          url: transcriptUrl,
          label: "Acessar Transcript",
          style: ButtonStyle.Link,
          emoji: "📄"
        }),
        new ButtonBuilder({
          customId: BUTTON_IDS.RATE_SERVICE,
          label: "Avaliar Atendimento",
          style: ButtonStyle.Success,
          emoji: "⭐"
        })
      ]
    });

    await user.send({
      embeds: [dmEmbed],
      components: [actionRow]
    });
  } catch (error) {
    console.error("Erro ao enviar DM:", error);
  }
}

function closeTicket(interaction: ButtonInteraction) {
  try {
    const channel = interaction.guild?.channels.cache.get(process.env.CANAL_LOG_TKT ?? "") as TextChannel;
    if (interaction.channel instanceof TextChannel && interaction.channel.name) {
      const transcriptUrl = `${process.env.URL_TRANSCRIPT}/transcript-${interaction.channelId}.html`;
      
      const logEmbed = new EmbedBuilder({
        title:(`Ticket  #${interaction.channel?.name}  Fechado com Transcript`),
        thumbnail: {
          url: process.env.LOGO ?? ""
        },
        description: `O Ticket foi fechado por <@${interaction.user.id}> **com transcript.**\nPara acessar o Transcript basta clicar no botão!`,
        timestamp: new Date().toISOString(),
        footer: {
          text: "Sistema de ticket byRomeraSCR"
        },
      });

      const actionRow = new ActionRowBuilder<ButtonBuilder>({
        components: [
          new ButtonBuilder({
            url: transcriptUrl,
            label: "Acessar Transcript",
            emoji: "📄",
            style: ButtonStyle.Link,
          })
        ],
      });

      channel.send({ embeds: [logEmbed], components: [actionRow] }).catch(console.error);
    } else {
      console.error('Canal de log inexistente');
    }
    interaction.channel?.delete().catch(console.error);
  } catch (error) {
    console.error("Erro ao fechar ticket:", error);
  }
}