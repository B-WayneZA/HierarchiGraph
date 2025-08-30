# MongoDB Atlas Setup Guide

This guide will help you set up MongoDB Atlas for the HierarchiGraph application.

## Step 1: Create MongoDB Atlas Account

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Click "Try Free" or "Sign Up"
3. Create an account or sign in with Google/GitHub

## Step 2: Create a Cluster

1. Click "Build a Database"
2. Choose "FREE" tier (M0)
3. Select your preferred cloud provider (AWS, Google Cloud, or Azure)
4. Choose a region close to your location
5. Click "Create"

## Step 3: Set Up Database Access

1. In the left sidebar, click "Database Access"
2. Click "Add New Database User"
3. Choose "Password" authentication
4. Create a username and password (save these!)
5. Select "Read and write to any database"
6. Click "Add User"

## Step 4: Set Up Network Access

1. In the left sidebar, click "Network Access"
2. Click "Add IP Address"
3. For development, click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production, add your specific IP addresses
5. Click "Confirm"

## Step 5: Get Connection String

1. Click "Database" in the left sidebar
2. Click "Connect"
3. Choose "Connect your application"
4. Select "Node.js" and version "4.1 or later"
5. Copy the connection string

## Step 6: Configure Environment Variables

1. Create a `.env` file in the backend directory
2. Add your MongoDB Atlas connection string:

```env
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/hierarchigraph?retryWrites=true&w=majority

# Other configurations
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
GRAVATAR_DEFAULT=identicon
GRAVATAR_SIZE=200
```

**Important:** Replace `your_username`, `your_password`, and `your_cluster` with your actual values.

## Step 7: Test Connection

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```

2. Test the connection:
   ```bash
   npm run dev
   ```

3. You should see:
   ```
   ✅ MongoDB connected successfully
   📊 Database: hierarchigraph
   🌐 Host: your-cluster.mongodb.net
   ```

## Step 8: Initialize Database

1. Run the database initialization script:
   ```bash
   npm run init-db
   ```

2. This will create sample users and employees with hierarchy relationships.

## Troubleshooting

### Connection Issues

1. **Authentication Error**: Check your username and password
2. **Network Access Error**: Ensure your IP is whitelisted
3. **Cluster Not Found**: Verify your cluster name in the connection string

### Common Error Messages

- `MongoNetworkError`: Check network access and connection string
- `Authentication failed`: Verify username/password
- `ECONNREFUSED`: Check if the cluster is running

### Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables for sensitive data**
3. **Restrict network access to specific IPs in production**
4. **Use strong passwords**
5. **Enable MongoDB Atlas security features**

## Production Considerations

1. **Upgrade to a paid tier** for better performance
2. **Set up proper network access** (not 0.0.0.0/0)
3. **Enable MongoDB Atlas security features**:
   - Database encryption
   - Network encryption
   - Audit logging
4. **Set up monitoring and alerts**
5. **Configure automated backups**

## Support

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Community Forums](https://developer.mongodb.com/community/forums/)
- [MongoDB Atlas Status Page](https://status.cloud.mongodb.com/)
