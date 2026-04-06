# Vercel Deployment Guide for Road Rescue

## Prerequisites

1. **Vercel Account**: Create an account at [vercel.com](https://vercel.com)
2. **GitHub Repository**: Push your code to GitHub
3. **MongoDB Database**: Set up MongoDB Atlas (recommended for production)

## Step 1: Install Dependencies

```bash
npm install serverless-http
```

## Step 2: Environment Variables Setup

### Required Environment Variables

In your Vercel dashboard, set these environment variables:

1. **MongoDB URI** (Required)
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/roadrescue
   ```

2. **JWT Secret** (Required - Generate a strong secret)
   ```
   JWT_SECRET=your-super-secret-jwt-key-change-in-production-2024
   ```

3. **Node Environment**
   ```
   NODE_ENV=production
   ```

### Optional Environment Variables

```
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=whatsapp:+14155238886

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

GOOGLE_MAPS_API_KEY=your-google-maps-api-key
RAZORPAY_KEY_ID=your-razorpay-key-id
RAZORPAY_KEY_SECRET=your-razorpay-key-secret
```

## Step 3: Deployment Steps

### Option 1: Using Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

### Option 2: Using GitHub Integration

1. Connect your GitHub repository to Vercel
2. Vercel will automatically detect the project configuration
3. Set environment variables in Vercel dashboard
4. Trigger deployment

## Step 4: MongoDB Setup

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Get your connection string
5. Add your IP to the whitelist (or use 0.0.0.0/0 for Vercel)
6. Set the `MONGODB_URI` environment variable

## Step 5: Verify Deployment

1. **Frontend**: Visit your Vercel URL
2. **Backend API**: Test `https://your-app.vercel.app/api/health`
3. **Database**: Check if user registration works

## File Structure for Deployment

```
road-rescue29/
├── api/
│   └── index.js           # Serverless function entry point
├── dist/                  # Built frontend (auto-generated)
├── server/
│   ├── Server.js          # Express app
│   ├── models/            # Database models
│   ├── services/          # Business logic
│   └── config/            # Database config
├── src/                   # React frontend source
├── vercel.json            # Vercel configuration
├── package.json           # Dependencies and scripts
└── vite.config.js         # Vite configuration
```

## Important Notes

### Database Connection
- The app will work without MongoDB in mock mode, but production requires a real database
- MongoDB Atlas is recommended for production deployments

### Socket.io Limitations
- Socket.io may not work optimally in serverless environments
- Consider using WebSockets alternatives or polling for real-time features

### Environment Variables
- Never commit `.env` files to version control
- Use Vercel's environment variable management for production secrets

### Performance
- Vercel functions have a maximum execution time (30 seconds in our config)
- Database queries should be optimized to avoid timeouts

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check `MONGODB_URI` environment variable
   - Ensure MongoDB Atlas IP whitelist includes Vercel's IPs

2. **Build Failures**
   - Check `package.json` for missing dependencies
   - Verify all imports are correct

3. **API 404 Errors**
   - Ensure `vercel.json` routes are configured correctly
   - Check that `api/index.js` exists and is properly structured

4. **CORS Issues**
   - The server includes CORS configuration
   - Verify frontend URL is properly set in environment variables

## Production Optimizations

1. **Database Indexing**: Ensure proper indexes for frequent queries
2. **Caching**: Implement Redis caching for frequently accessed data
3. **Monitoring**: Set up Vercel Analytics and error tracking
4. **Security**: Regularly update dependencies and monitor for vulnerabilities

## Post-Deployment Checklist

- [ ] Test user registration and login
- [ ] Test emergency request submission
- [ ] Test provider search functionality
- [ ] Verify real-time features work
- [ ] Check mobile responsiveness
- [ ] Test payment flows (if implemented)
- [ ] Monitor error logs in Vercel dashboard

## Support

For deployment issues:
1. Check Vercel deployment logs
2. Verify environment variables
3. Test API endpoints individually
4. Check MongoDB connection status
