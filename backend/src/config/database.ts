import * as gremlin from 'gremlin';
import dotenv from 'dotenv';

const { DriverRemoteConnection } = gremlin.driver;
const { Graph } = gremlin.structure;

dotenv.config();

// AWS Neptune Configuration
const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT || 'localhost';
const NEPTUNE_PORT = parseInt(process.env.NEPTUNE_PORT || '8182', 10);
const NEPTUNE_SSL = process.env.NEPTUNE_SSL === 'true';
const NEPTUNE_REGION = process.env.AWS_REGION || 'us-east-1';

let connection: typeof DriverRemoteConnection | null = null;
let graph: typeof Graph | null = null;
let g: any = null;

export const connectDB = async (): Promise<void> => {
  try {
    const connectionOptions: any = {
      endpoint: NEPTUNE_ENDPOINT,
      port: NEPTUNE_PORT,
      ssl: NEPTUNE_SSL,
    };

    // If using AWS Neptune (not local), add AWS credentials
    if (NEPTUNE_SSL && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      connectionOptions.region = NEPTUNE_REGION;
      connectionOptions.accessKeyId = process.env.AWS_ACCESS_KEY_ID;
      connectionOptions.secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    }

    const protocol = NEPTUNE_SSL ? 'wss' : 'ws';
    connection = new (DriverRemoteConnection as any)(
      `${protocol}://${NEPTUNE_ENDPOINT}:${NEPTUNE_PORT}/gremlin`,
      connectionOptions
    );

    graph = new (Graph as any)();
    if (!connection) {
      throw new Error('Failed to initialize Gremlin connection');
    }
    // DriverRemoteConnection expects the raw instance, not the type
    g = (graph as any).traversal().withRemote(connection as any);

    // Test connection: make sure the graph traversal works (will throw if not)
    await g.V().limit(1).toList();

    console.log('✅ AWS Neptune connected successfully');
    console.log(`📊 Endpoint: ${NEPTUNE_ENDPOINT}:${NEPTUNE_PORT}`);
    console.log(`🔒 SSL: ${NEPTUNE_SSL}`);
  } catch (error) {
    console.error('❌ Neptune connection error:', error);
    process.exit(1);
  }
};

export const disconnectDB = async (): Promise<void> => {
  try {
    if (connection) {
      // The close() method does not exist on DriverRemoteConnection. Use open and close if available, or simply drop the reference.
      if (typeof (connection as any).close === 'function') {
        await (connection as any).close();
      }
      connection = null;
      graph = null;
      g = null;
      console.log('✅ Neptune disconnected successfully');
    }
  } catch (error) {
    console.error('❌ Neptune disconnection error:', error);
  }
};

export const getGraphTraversal = () => {
  if (!g) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return g;
};

export const getGraph = (): typeof Graph => {
  if (!graph || !connection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return graph;
};

export const getConnection = (): typeof DriverRemoteConnection => {
  if (!connection) {
    throw new Error('Database not connected. Call connectDB() first.');
  }
  return connection;
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
