import neo4j, { Driver } from 'neo4j-driver';
import AWS from 'aws-sdk';
import dotenv from 'dotenv';

dotenv.config();

const client = new AWS.SecretsManager({
  region: "eu-north-1",
}); 
const secret_name = "Neo4j";

async function getNeo4jSecrets() {
  const secret = await client.getSecretValue({ SecretId: secret_name }).promise();
  return JSON.parse(secret.SecretString!);
}

/*
const NEO4J_URI = process.env.NEO4J_URI;
const NEO4J_USER = process.env.NEO4J_USER;
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD;
*/

let driver: Driver | null = null;

export const connectDB = async (): Promise<void> => {
    const { NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD } = await getNeo4jSecrets();

  if (!NEO4J_URI || !NEO4J_USER || !NEO4J_PASSWORD) {
    console.error('❌ Neo4j connection details are missing in environment variables.');
    process.exit(1);
  }

  try {
    driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
    await driver.verifyConnectivity();
    console.log('✅ Neo4j Aura connected successfully');
    console.log(`📊 Database: ${NEO4J_URI}`);
  } catch (error) {
    console.error('❌ Neo4j connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    if (driver) {
      await driver.close();
      driver = null;
      console.log('✅ Neo4j disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Neo4j disconnection error:', error);
  }
};

export const getDriver = (): Driver => {
  if (!driver) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return driver;
};

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await disconnectDB();
  process.exit(0);
});
