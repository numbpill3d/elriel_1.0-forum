# Deploying Elriel to Render.com

This guide provides instructions for deploying the Elriel forum application to Render.com's free tier and connecting it to your custom domain.

## Prerequisites

1. A GitHub account
2. Your Supabase project already set up with tables created
3. A custom domain (optional)

## Preparation

The following files have been created or modified for deployment:

- `app_production.js`: Production-ready app with Supabase integration
- `package.json`: Updated to use the production app for the start command
- `render.yaml`: Blueprint file for automatic deployment
- `.env.production`: Template for production environment variables
- `.gitignore`: Prevents sensitive files from being committed
- `Procfile`: Alternative start command for some platforms
- `README.md`: Project documentation

## Option 1: Manual Deployment

### 1. Push your code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/elriel-forum.git
git push -u origin main
```

### 2. Deploy on Render.com

1. Create an account at [render.com](https://render.com/)
2. Click "New +" and select "Web Service"
3. Connect your GitHub account and select your repository
4. Configure your service:
   - **Name**: elriel-forum (or any name you prefer)
   - **Runtime**: Node
   - **Region**: Choose closest to your users
   - **Branch**: main
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: Free

5. Add environment variables (click "Advanced" → "Add Environment Variable"):
   - `NODE_ENV`: production
   - `PORT`: 3000
   - `SESSION_SECRET`: [a strong random string]
   - `SUPABASE_URL`: https://uilpkauiihtcrgxmtdob.supabase.co
   - `SUPABASE_KEY`: [your Supabase anon key]
   - `SUPABASE_SERVICE_KEY`: [your Supabase service role key]

6. Click "Create Web Service"

## Option 2: Blueprint Deployment

This project includes a `render.yaml` blueprint file for easier deployment:

1. Fork this repository on GitHub
2. Visit [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
3. Click "New Blueprint Instance"
4. Connect to your GitHub account if not already connected
5. Select your fork of this repository
6. Render will detect the `render.yaml` file and create resources
7. You'll need to provide values for the environment variables

## Connecting Your Custom Domain

1. In Render dashboard, go to your web service
2. Click "Settings" → "Custom Domain"
3. Click "Add Custom Domain"
4. Enter your domain name (e.g., elriel.com)
5. Follow Render's instructions to verify domain ownership by adding DNS records:

   ### For Namecheap:
   - Go to your Namecheap dashboard
   - Select your domain → "Manage"
   - Go to "Advanced DNS"
   - Add a CNAME record:
     - Type: CNAME
     - Host: www (or @ for root domain)
     - Value: [your-app-name].onrender.com
     - TTL: Automatic

   ### For GoDaddy:
   - Go to your GoDaddy dashboard
   - Select your domain → "DNS"
   - Add a CNAME record:
     - Type: CNAME
     - Name: www (or @ for root domain)
     - Value: [your-app-name].onrender.com
     - TTL: 1 hour

6. Wait for DNS propagation (can take up to 48 hours, but usually much faster)
7. Render will automatically provision an SSL certificate once DNS is verified

## Troubleshooting

- **Application Error**: Check your Render logs for specific errors
- **Database Connection Issues**: Verify your Supabase credentials in environment variables
- **CSS/JS Not Loading**: Make sure static file serving is working properly
- **Slow Initial Load**: Free tier services "sleep" after 15 minutes of inactivity

## Keeping Your Site Awake

Render free tier services "sleep" after 15 minutes of inactivity. To keep your site awake:

1. Set up a monitoring service like UptimeRobot to ping your site every 10-15 minutes
2. Add the `/health` endpoint to be pinged, as it's lightweight and doesn't count as significant usage