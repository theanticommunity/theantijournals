# Operational Costs — Anti Journal

## Infrastructure Costs (Monthly, Estimated)

| Service | Free Tier | Paid Tier | Notes |
|---------|-----------|-----------|-------|
| Supabase (PostgreSQL + Auth + Edge Functions + Storage) | $0 (500MB DB, 1GB bandwidth, 2M Edge Function invocations) | $25+/month | Sufficient for low-to-medium traffic |
| Firebase Hosting | $0 (1GB storage, 10GB/month bandwidth) | Pay-as-you-go | Sufficient for static frontend |
| Paystack | Free (no monthly fee) | Transaction fees (1.5% + ₦100 for local, 3.9% + ₦100 for international) | Per-transaction only |
| GitHub | $0 (public/private repos) | $4/user/month (Team) | Source control only |

## Estimated Monthly Cost

| Tier | Cost | Includes |
|------|------|----------|
| Free | $0 | Supabase free tier + Firebase Hosting free tier + Paystack per-transaction fees |
| Low traffic | $0–$25 | Within Supabase free tier limits |
| Medium traffic | $25–$50 | Supabase paid tier |
| High traffic | $50+ | Depends on bandwidth and Edge Function invocations |

## Cost Optimization

- Use Supabase free tier as long as possible
- Cache static content via Firebase Hosting CDN
- Monitor Edge Function invocations (each function call counts)
- Use Paystack test mode for development to avoid transaction fees
- Archive old analytics events to control database size

## Transaction Fees (Paystack)

Paystack charges per successful transaction. These are not monthly fees but per-transaction costs that scale with revenue.

- Local cards: 1.5% + ₦100 per transaction (capped at ₦2,000)
- International cards: 3.9% + ₦100 per transaction
- Transfers to bank: ₦100 per transfer
