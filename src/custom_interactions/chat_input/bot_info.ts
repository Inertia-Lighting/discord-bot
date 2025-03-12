//------------------------------------------------------------//
//    Copyright (c) Inertia Lighting, Some Rights Reserved    //
//------------------------------------------------------------//

import * as Discord from 'discord.js';

import { CustomEmbed } from '@root/common/message';

import { CustomInteraction, CustomInteractionAccessLevel, CustomInteractionRunContext } from '@root/common/managers/custom_interactions_manager';

import { execSync } from "child_process";

import top from "process-top"; 

//------------------------------------------------------------//

const topLoad = top() //Need load function for have register of CPU

//------------------------------------------------------------//

export default new CustomInteraction({
    identifier: 'bot_info',
    type: Discord.InteractionType.ApplicationCommand,
    data: {
        type: Discord.ApplicationCommandType.ChatInput,
        description: 'Used by developers to get bot information.',
    },
    metadata: {
        required_run_context: CustomInteractionRunContext.Guild,
        required_access_level: CustomInteractionAccessLevel.Dev,
    },
    handler: async (discord_client, interaction) => {
        if (!interaction.isChatInputCommand()) return;
        if (!interaction.inCachedGuild()) return;
        if (!interaction.channel) return;

        await interaction.deferReply({ ephemeral: true });
    
        const cpu = topLoad.cpu();
        const memory = topLoad.memory();

        function toPorcentage (value: number): string {
            return `${(value*100).toFixed(1)}%`
        }

        function toMB (bytes: number): string {
            return `${(bytes / (1024 * 1024)).toFixed(0)} MB`
        }

        function getCurrentCommit(): string {
            try {
                return execSync("git rev-parse HEAD").toString().trim();
            } catch (error) {
                console.error("Error getting commit:", error);
                return "Error to get git commit";
            }
        }

        await interaction.editReply({
            embeds: [
                CustomEmbed.from({
                    title: "Bot Information",
                    fields: [
                        { name: "Process ID", value: `${process.pid}` },
                        { name: "CPU usage", value: `${toPorcentage(cpu.percent)}` },
                        { name: "Memory usage", value: `__RSS__: ${toMB(memory.rss)} (${toPorcentage(memory.percent)}%) \n__Heap__: ${toMB(memory.heapUsed)} / ${toMB(memory.heapTotal)} (${toPorcentage(memory.heapPercent)})` },
                        { name: "Git Commit", value: `${getCurrentCommit()}` }
                    ]
                }),
            ]
        }).catch(console.warn);
    },
});
