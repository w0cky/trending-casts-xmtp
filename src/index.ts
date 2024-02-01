import dotenv from "dotenv";
dotenv.config();

import express, { Request, Response } from 'express';
import { CronJob } from 'cron';
import { FeedType, FilterType } from "@neynar/nodejs-sdk";
import { Cast } from "@neynar/nodejs-sdk/build/neynar-api/v2";
import createNeynarClient from "./Neynar";
import run, { BotContext } from "./Runner";

// Function to fetch and send trending casts
async function sendTrendingCasts(context: BotContext): Promise<void> {
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

async function sendStopMessage(context: BotContext): Promise<void> {
    try {
        await context.reply('You will stop receiving messages. Reply with !start to start again.')
    } catch (error: any) {
        console.error('Error fetching or sending trending casts:', error.message);
    }
}

const app = express();
const port = process.env.PORT || 4000;

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// Initialize the bot
run(async (context) => {
    const scheduledTime = process.env.CRON_TIME;
    if (!scheduledTime) {
        throw new Error("CRON_TIME is undefined.");
    }

    let job = CronJob.from(
        {
            cronTime: scheduledTime, // cronTime
            onTick: () => sendTrendingCasts(context), // onTick
            onComplete: () => sendStopMessage(context), // onComplete
            start: true, // start
            runOnInit: true
        });
    switch (context.message.content.trim()) {
        case '!start':
            context.reply('Started. You will receive the top 3 trending casts daily. Type !stop to stop.')
            job.start();
            break;
        case '!next':
            context.reply(`${job.nextDate().diffNow('minutes')} min. until the next update`)
            break;
        case '!stop':
            job.stop();
            break;
        default:
            console.log('Invalid command:', context.message.content);
    }
});
