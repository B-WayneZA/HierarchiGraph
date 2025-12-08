import { config } from 'dotenv';

// Load environment variables for deployment
config();

export const deploymentConfig = {
  // Server Configuration
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'production',
  
  // AWS Neptune Configuration
  neptuneEndpoint: process.env.NEPTUNE_ENDPOINT,
  neptunePort: process.env.NEPTUNE_PORT || '8182',
  neptuneSsl: process.env.NEPTUNE_SSL === 'true',
  
  // JWT Configuration
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  
  // CORS Configuration
  corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // AWS Configuration
  aws: {
    region: process.env.AWS_REGION || 'us-east-1',
    instanceId: process.env.AWS_INSTANCE_ID,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
  
  // PM2 Configuration
  pm2: {
    name: 'hierarchigraph-backend',
    instances: process.env.PM2_INSTANCES || 'max',
    execMode: 'cluster',
    maxMemoryRestart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 5000,
    }
  },
  
  // Nginx Configuration
  nginx: {
    serverName: process.env.NGINX_SERVER_NAME || 'your-domain.com',
    sslCertPath: process.env.SSL_CERT_PATH,
    sslKeyPath: process.env.SSL_KEY_PATH,
  }
};

export const validateDeploymentConfig = () => {
  const required = [
    'NEPTUNE_ENDPOINT',
    'JWT_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY'
  ];
  
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  console.log('✅ Deployment configuration validated');
};
