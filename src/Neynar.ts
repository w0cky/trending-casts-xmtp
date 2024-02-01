import { NeynarAPIClient, FeedType, FilterType } from "@neynar/nodejs-sdk";

export default function createNeynarClient(): NeynarAPIClient {
  const key = process.env.NEYNAR_API_KEY

  if (!key) {
    throw new Error("NEYNAR_API_KEY required.");
  }

  const client = new NeynarAPIClient(key);

  return client
}