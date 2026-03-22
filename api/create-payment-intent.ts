import Stripe from "stripe";
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { amount, currency = 'usd' } = req.body;
    
    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) {
      return res.status(500).json({ error: 'STRIPE_SECRET_KEY environment variable is required' });
    }

    const stripe = new Stripe(key);
    
    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Stripe expects amounts in cents
      currency,
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.status(200).json({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error: any) {
    console.error("Stripe error:", error);
    res.status(500).json({ error: error.message });
  }
}
