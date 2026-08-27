"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const index_1 = tslib_1.__importDefault(require("../../../index"));
const base_1 = require("../../base");
const discord_js_1 = require("discord.js");
const dotenv_1 = tslib_1.__importDefault(require("dotenv"));
dotenv_1.default.config();
const config = process.env;
const rcon = new index_1.default(config.RCON_HOST || "127.0.0.1", parseInt(config.RCON_PORT || "30120", 10), config.RCON_PASSWORD || "123456");
const restrictedCommands = ["quit", "rrcity", "refresh"];
new base_1.Event({
    name: "ready",
    async run(client) {
        const canalId = config.CANALCONSOLE || "";
        const channel = client.channels.cache.get(canalId);
        if (!channel || !(channel instanceof discord_js_1.TextChannel)) {
            console.error(`Canal "${canalId}" não encontrado ou não é um canal de texto.`);
            return;
        }
        try {
            const messages = await channel.messages.fetch({ limit: 100 });
            if (messages.size > 0) {
                await channel.bulkDelete(messages, true);
                console.log(`[✅] Canal ${channel.name} limpo com sucesso!`);
            }
            else {
                console.log(`[ℹ️] Canal ${channel.name} já estava vazio.`);
            }
        }
        catch (err) {
            console.error(`[❌] Erro ao limpar o canal "${channel.name}":`, err);
        }
    }
});
new base_1.Event({
    name: "messageCreate",
    async run(message) {
        if (message.author.bot)
            return;
        const canalId = config.CANALCONSOLE || "";
        if (message.channel.id !== canalId)
            return;
        const member = message.member;
        const requiredRole = config.RCARGO?.toString();
        if (!member || !requiredRole || !member.roles.cache.has(requiredRole)) {
            console.log(`[⛔] ${message.author.tag} tentou executar um comando sem permissão.`);
            return;
        }
        const prefix = config.PREFIX || "$";
        if (message.content.startsWith(prefix)) {
            if (!(message.channel instanceof discord_js_1.TextChannel))
                return;
            const channel = message.channel;
            const command = message.content.slice(prefix.length).trim().toLowerCase();
            if (restrictedCommands.includes(command) && message.guild?.ownerId !== message.author.id) {
                console.log(`[⛔] ${message.author.tag} tentou executar "${command}" sem ser o dono do servidor.`);
                channel.send(`⛔ Apenas o dono do servidor pode executar o comando "${command}".`);
                return;
            }
            try {
                const response = await rcon.command(command);
                let result = response.get();
                result = result.replace(/\x1B\[[0-9;]*[A-Za-z]/g, '');
                const playerName = message.author.username;
                if (result.trim()) {
                    channel.send(`\`\`\`ini\n🔹 ${result}\`\`\``);
                }
                else {
                    channel.send(`\`🔹 Comando executado: ${playerName} "${command}"\``);
                }
            }
            catch (err) {
                console.error(`[❌] Erro ao executar comando "${command}":`, err);
                channel.send(`Erro ao executar o comando: ${err}`);
            }
        }
    }
});
