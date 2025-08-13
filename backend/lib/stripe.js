import dotenv from "dotenv";
import path from "path";
// dotenv.config(); 
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });

import Stripe from "stripe";

// console.log("Stripe key loaded?", process.env.STRIPE_SECRET_KEY);

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("❌ STRIPE_SECRET_KEY is missing from .env file");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});
