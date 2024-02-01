import dotenv from "dotenv";
dotenv.config();

import run from "./Runner";
import createNeynarClient from "./Neynar";
import { FeedType, FilterType } from "@neynar/nodejs-sdk";
import { Cast } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import * as cron from 'cron';

// Import types and functions
type BotContext = { reply: (message: string) => Promise<void> };

// Function to fetch and send trending casts
async function sendTrendingCasts(context: BotContext) {
    try {
        const client = createNeynarClient();
        const feed = await client.fetchFeed(FeedType.Filter, {
            filterType: FilterType.GlobalTrending,
            limit: 3
        });

        let message = "Trending Casts:\n";
        for (const cast of feed.casts) {
            message += formatTrendingNotification(cast);
        }

        console.log(message);
        await context.reply(message);
    } catch (error: any) {
        console.error('Error fetching or sending trending casts:', error.message);
    }
}

// Utility function to remove URLs from text
function removeUrls(input: string): string {
    return input.replace(/(https?:\/\/[^\s]+)/g, '').trim();
}

// Format a trending cast notification
function formatTrendingNotification(cast: Cast): string {
    return `👤 ${cast.author.display_name} (@${cast.author.username})\n` +
           `"${removeUrls(cast.text)}"\n` +
           `https://warpcast.com/${cast.author.username}/${cast.hash.substring(0, 10)} \n\n`;
}

// Initialize the bot
run(async (context) => {
    const scheduledTime = process.env.CRON_TIME;

    if (!scheduledTime) {
        throw new Error("CRON_TIME is undefined.")
    }

    const job = new cron.CronJob(scheduledTime, () => sendTrendingCasts(context), null, true);

    switch(context.message.content) {
        case '!start':
            job.start();
            break;
        case '!stop':
            job.stop();
            break;
        default:
            console.log('Invalid command:', context.message.content);
    }
});
