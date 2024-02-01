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

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req: Request, res: Response) => {
    res.send('Hello World!');
});

const server = app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});

// Initialize the bot
run(async (context) => {
    const scheduledTime = process.env.CRON_TIME;
    console.log(process.env);
    if (!scheduledTime) {
        throw new Error("CRON_TIME is undefined.");
    }

    let job = new CronJob(
        scheduledTime, // cronTime
        () => sendTrendingCasts(context), // onTick
        null, // onComplete
        true, // start
    );
    switch (context.message.content) {
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
