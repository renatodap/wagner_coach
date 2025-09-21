# Deployment Guide - Wagner Coach

## Accessing Your Deployment

### If Blocked by Web Filter:

1. **Use Alternative URLs**:
   - Check Vercel Dashboard for preview URLs
   - Each deployment gets a unique URL

2. **Add Custom Domain** (Recommended):
   - Buy a domain (e.g., from Namecheap, GoDaddy)
   - Add it in Vercel Dashboard → Settings → Domains
   - Custom domains rarely get blocked

3. **Local Development**:
   ```bash
   # Run locally while waiting
   npm run dev
   ```
   Access at: http://localhost:3000

### Setting Up Custom Domain in Vercel:

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add your custom domain
4. Update DNS records as instructed
5. Your app will be available at your custom domain

### Environment Variables Setup:

Make sure these are set in Vercel:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Deployment Status Check:

1. **Via GitHub**: Check Actions tab for deployment status
2. **Via Vercel CLI**:
   ```bash
   npm i -g vercel
   vercel
   ```

### If Still Blocked:

Some networks block all *.vercel.app domains. Solutions:
- Use custom domain (best solution)
- Access from different network
- Use VPN (if allowed)
- Deploy to alternative platform (Netlify, Railway)