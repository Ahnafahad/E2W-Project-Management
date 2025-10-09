# E2W Project Management - Deployment Guide

This guide will help you deploy the E2W Project Management application to Vercel's free tier.

## Prerequisites

1. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas Account** - Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
3. **GitHub Account** - Required for connecting your repository to Vercel

## Step 1: Setup MongoDB Atlas (Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Create a new cluster (choose the free M0 tier)
3. Select a cloud provider and region closest to your users
4. Wait for the cluster to deploy (2-3 minutes)
5. Click "Connect" on your cluster
6. Add your IP address to the whitelist (or allow access from anywhere: `0.0.0.0/0`)
7. Create a database user with username and password
8. Get your connection string:
   - Click "Connect" > "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `myFirstDatabase` with `e2w-pm`

Your connection string should look like:
```
mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/e2w-pm?retryWrites=true&w=majority
```

## Step 2: Generate NextAuth Secret

Run this command in your terminal to generate a secure secret:

```bash
openssl rand -base64 32
```

Or use an online generator: [generate-secret.vercel.app](https://generate-secret.vercel.app/32)

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repository
4. Configure your project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `./e2w-project-management` (if in monorepo)
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
   - **Install Command**: `npm install`

5. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB connection string
   - `NEXTAUTH_SECRET`: Your generated secret
   - `NEXTAUTH_URL`: `https://your-app-name.vercel.app`
   - `NODE_ENV`: `production`

6. Click "Deploy"

### Option B: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Navigate to project directory:
   ```bash
   cd e2w-project-management
   ```

4. Deploy:
   ```bash
   vercel
   ```

5. Follow the prompts and add environment variables when asked

6. For production deployment:
   ```bash
   vercel --prod
   ```

## Step 4: Configure Environment Variables

In your Vercel dashboard:

1. Go to your project
2. Click "Settings" > "Environment Variables"
3. Add the following variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `MONGODB_URI` | Your MongoDB connection string | Production, Preview, Development |
| `NEXTAUTH_SECRET` | Your generated secret | Production, Preview, Development |
| `NEXTAUTH_URL` | `https://your-app.vercel.app` | Production |
| `NEXTAUTH_URL` | `https://your-app-preview.vercel.app` | Preview |
| `NEXTAUTH_URL` | `http://localhost:9696` | Development |
| `NODE_ENV` | `production` | Production, Preview |

## Step 5: Verify Deployment

1. Visit your deployed URL: `https://your-app-name.vercel.app`
2. Test the following:
   - Registration/Login works
   - Can create projects
   - Can create tasks
   - PWA install prompt appears (on mobile/supported browsers)
   - Offline functionality works

## Step 6: Setup Custom Domain (Optional)

1. In Vercel dashboard, go to "Settings" > "Domains"
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXTAUTH_URL` environment variable to your custom domain

## Troubleshooting

### Build Fails

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify TypeScript errors locally: `npm run build`

### Database Connection Issues

- Verify MongoDB connection string is correct
- Check IP whitelist in MongoDB Atlas
- Ensure database user has read/write permissions

### NextAuth Errors

- Verify `NEXTAUTH_SECRET` is set
- Ensure `NEXTAUTH_URL` matches your deployment URL
- Check that the URL includes `https://` for production

### PWA Not Working

- Service worker only works over HTTPS (Vercel provides this automatically)
- Clear cache and reload
- Check browser console for service worker errors

## Performance Optimization

### Free Tier Limits

Vercel Free Tier includes:
- 100 GB bandwidth per month
- 100 hours of serverless function execution
- Automatic SSL
- Edge Network (CDN)

### Optimize for Free Tier

1. **Enable caching**:
   - Static assets are automatically cached
   - API responses can be cached using `Cache-Control` headers

2. **Reduce function execution time**:
   - Keep API routes fast (<10 seconds)
   - Use MongoDB indexes for better query performance

3. **Minimize bundle size**:
   - Already optimized with Next.js automatic code splitting
   - Tree shaking removes unused code

## Monitoring

### Vercel Analytics

1. Go to your project in Vercel dashboard
2. Click "Analytics" to see:
   - Page views
   - Performance metrics
   - Error tracking (with paid plan)

### MongoDB Monitoring

1. In MongoDB Atlas dashboard
2. Click "Metrics" to see:
   - Connection count
   - Operations per second
   - Storage usage

## Updating Your App

### Via Git

1. Push changes to your GitHub repository:
   ```bash
   git add .
   git commit -m "Update features"
   git push
   ```

2. Vercel automatically deploys on push to main branch

### Manual Deployment

```bash
vercel --prod
```

## Security Best Practices

1. **Never commit `.env.local`** - Use `.env.example` only
2. **Rotate secrets regularly** - Generate new `NEXTAUTH_SECRET` periodically
3. **Use environment-specific URLs** - Different URLs for dev/preview/prod
4. **Enable 2FA** - On both Vercel and MongoDB Atlas accounts
5. **Review access logs** - Check MongoDB and Vercel logs regularly

## Support

- **Documentation**: [docs.e2w.com](https://docs.e2w.com) (if available)
- **Issues**: Create an issue on GitHub
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **MongoDB Support**: [mongodb.com/support](https://www.mongodb.com/support)

## Cost Breakdown (Free Tier)

| Service | Free Tier | Cost if Exceeded |
|---------|-----------|------------------|
| Vercel | 100 GB bandwidth/month | $20/mo for Pro |
| MongoDB Atlas | 512 MB storage | $9/mo for M2 |
| **Total** | **$0/month** | **~$29/month** |

## Next Steps

1. ✅ Deploy to production
2. ✅ Configure custom domain
3. ✅ Setup monitoring
4. ✅ Share with team
5. ✅ Start managing projects!

---

**Congratulations!** 🎉 Your E2W Project Management system is now live and ready to use.
