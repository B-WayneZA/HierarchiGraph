"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnection = exports.getGraph = exports.getGraphTraversal = exports.disconnectDB = exports.connectDB = void 0;
const gremlin = __importStar(require("gremlin"));
const dotenv_1 = __importDefault(require("dotenv"));
const { DriverRemoteConnection } = gremlin.driver;
const { Graph } = gremlin.structure;
dotenv_1.default.config();
// AWS Neptune Configuration
const NEPTUNE_ENDPOINT = process.env.NEPTUNE_ENDPOINT || 'localhost';
const NEPTUNE_PORT = parseInt(process.env.NEPTUNE_PORT || '8182', 10);
const NEPTUNE_SSL = process.env.NEPTUNE_SSL === 'true';
const NEPTUNE_REGION = process.env.AWS_REGION || 'us-east-1';
let connection = null;
let graph = null;
let g = null;
const connectDB = async () => {
    try {
        const connectionOptions = {
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
        connection = new DriverRemoteConnection(`${protocol}://${NEPTUNE_ENDPOINT}:${NEPTUNE_PORT}/gremlin`, connectionOptions);
        graph = new Graph();
        if (!connection) {
            throw new Error('Failed to initialize Gremlin connection');
        }
        // DriverRemoteConnection expects the raw instance, not the type
        g = graph.traversal().withRemote(connection);
        // Test connection: make sure the graph traversal works (will throw if not)
        await g.V().limit(1).toList();
        console.log('✅ AWS Neptune connected successfully');
        console.log(`📊 Endpoint: ${NEPTUNE_ENDPOINT}:${NEPTUNE_PORT}`);
        console.log(`🔒 SSL: ${NEPTUNE_SSL}`);
    }
    catch (error) {
        console.error('❌ Neptune connection error:', error);
        process.exit(1);
    }
};
exports.connectDB = connectDB;
const disconnectDB = async () => {
    try {
        if (connection) {
            // The close() method does not exist on DriverRemoteConnection. Use open and close if available, or simply drop the reference.
            if (typeof connection.close === 'function') {
                await connection.close();
            }
            connection = null;
            graph = null;
            g = null;
            console.log('✅ Neptune disconnected successfully');
        }
    }
    catch (error) {
        console.error('❌ Neptune disconnection error:', error);
    }
};
exports.disconnectDB = disconnectDB;
const getGraphTraversal = () => {
    if (!g) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return g;
};
exports.getGraphTraversal = getGraphTraversal;
const getGraph = () => {
    if (!graph || !connection) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return graph;
};
exports.getGraph = getGraph;
const getConnection = () => {
    if (!connection) {
        throw new Error('Database not connected. Call connectDB() first.');
    }
    return connection;
};
exports.getConnection = getConnection;
// Graceful shutdown
process.on('SIGINT', async () => {
    await (0, exports.disconnectDB)();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await (0, exports.disconnectDB)();
    process.exit(0);
});
//# sourceMappingURL=database.js.map