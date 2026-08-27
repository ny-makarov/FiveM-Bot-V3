import { Event } from "@/discord/base";
import { Client, EmbedBuilder, TextChannel } from "discord.js";
import dotenv from 'dotenv';
import { hexToRgb } from "@magicyan/core";
import { createRow } from "@magicyan/discord";
import { StringSelectMenuBuilder } from "discord.js";
import { settings } from "@/settings";

dotenv.config();

new Event({
  name: "ready",
  async run(client: Client) {
    if (!process.env.CANAL_TICKETID) {
      console.error('Channel ID not provided in the environment variable.');
      return;
    }

    try {
      const channel = await client.channels.fetch(process.env.CANAL_TICKETID);

      if (channel instanceof TextChannel) {
        // Enviar a mensagem inicial
        await sendTicketMessage(channel);

        // Registrar evento para lidar com a exclusão da mensagem
        client.on("messageDelete", async (deletedMessage) => {
          if (deletedMessage.id === process.env.CANAL_TICKETID) {
            // Enviar a mensagem novamente após a exclusão
            await sendTicketMessage(channel);
          } 
        });
                // Registrar evento para lidar com a exclusão da mensagem
                client.on("messageDelete", async (deletedMessage) => {
                  if (deletedMessage.id === process.env.CANAL_TICKETID) {
                    // Enviar a mensagem novamente após a exclusão
                    await sendTicketMessage(channel);
                  } 
                });

      } else {
        console.error('Canal inexistente');
      }
    } catch (error) {
      console.error('Error fetching channel:', error);
    }
  }
});

async function sendTicketMessage(channel: TextChannel) {
  try {
    await channel.bulkDelete(100, true);
  } catch (error) {
    console.error('Error deleting messages:', error);
  }

  const embed = new EmbedBuilder({
    title: "Sistema de Ticket Automático",
    description: "Para obter **AJUDA** abra um ticket selecionando um item\n no menu abaixo abra um ticket, após aberto aguardar.",
    color: hexToRgb(settings.colors.theme.default),
    footer: {
      text: "Lembre-se não abra um ticket sem necessidade",
    },
    thumbnail:{
      url: process.env.LOGO ?? ""
    },
    image: {
      url: process.env.BANNERTK ?? "",
  }
  });

  const row = createRow(
    new StringSelectMenuBuilder({
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
    })
  );

  try {
    await channel.send({ embeds: [embed], components: [row], ephemeral: false } as any);
  } catch (error) {
    console.error('Error sending message:', error);
  }
}
