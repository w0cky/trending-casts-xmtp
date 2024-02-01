import "./Environment"
import { Client } from "@xmtp/xmtp-js"
import { Wallet } from "ethers"

export default async function createClient(): Promise<Client> {
  let wallet: Wallet
  const key = process.env.KEY

  if (key) {
    wallet = new Wallet(key)
  } else {
    wallet = Wallet.createRandom()
    console.log("Set your environment variable: KEY=" + wallet.privateKey)
  }

  const client = await Client.create(wallet, {
    env:
      (process.env.XMTP_ENV as "dev" | "production" | "local") || "production",
  })

  await client.publishUserContact()

  return client
}