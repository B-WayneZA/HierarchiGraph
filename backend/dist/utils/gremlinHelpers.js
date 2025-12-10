"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTraversal = exports.vertexExistsByProperty = exports.findVertexByProperty = exports.getVertexById = exports.getGravatarUrl = exports.edgeToObject = exports.vertexToObject = void 0;
const database_1 = require("../config/database");
const crypto_1 = __importDefault(require("crypto"));
/**
 * Convert a Gremlin vertex to a plain object
 */
const vertexToObject = (vertex) => {
    if (!vertex)
        return null;
    const obj = {
        id: vertex.id.toString(),
    };
    // Extract properties from the vertex
    if (vertex.properties) {
        for (const [key, values] of Object.entries(vertex.properties)) {
            if (Array.isArray(values) && values.length > 0) {
                // Gremlin properties are arrays, take the first value
                obj[key] = values[0].value;
            }
        }
    }
    return obj;
};
exports.vertexToObject = vertexToObject;
/**
 * Convert Gremlin edge to a plain object
 */
const edgeToObject = (edge) => {
    if (!edge)
        return null;
    return {
        id: edge.id.toString(),
        label: edge.label,
        inV: edge.inV.toString(),
        outV: edge.outV.toString(),
    };
};
exports.edgeToObject = edgeToObject;
/**
 * Generate Gravatar URL from email
 */
const getGravatarUrl = (email, size = 200) => {
    const hash = crypto_1.default.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
    const defaultAvatar = process.env.GRAVATAR_DEFAULT || 'identicon';
    return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}`;
};
exports.getGravatarUrl = getGravatarUrl;
/**
 * Helper to get a vertex by ID
 */
const getVertexById = async (vertexId, label) => {
    const g = (0, database_1.getGraphTraversal)();
    const result = await g.V(vertexId).hasLabel(label).valueMap(true).toList();
    return result.length > 0 ? result[0] : null;
};
exports.getVertexById = getVertexById;
/**
 * Helper to find a vertex by property
 */
const findVertexByProperty = async (label, property, value) => {
    const g = (0, database_1.getGraphTraversal)();
    const result = await g.V().hasLabel(label).has(property, value).valueMap(true).toList();
    return result.length > 0 ? result[0] : null;
};
exports.findVertexByProperty = findVertexByProperty;
/**
 * Helper to check if a vertex exists by property
 */
const vertexExistsByProperty = async (label, property, value) => {
    const g = (0, database_1.getGraphTraversal)();
    const count = await g.V().hasLabel(label).has(property, value).count().next();
    return count.value > 0;
};
exports.vertexExistsByProperty = vertexExistsByProperty;
const gremlin_1 = __importDefault(require("gremlin"));
const DriverRemoteConnection = gremlin_1.default.driver.DriverRemoteConnection;
const Graph = gremlin_1.default.structure.Graph;
const getTraversal = () => {
    const dc = new DriverRemoteConnection(process.env.NEPTUNE_ENDPOINT, {
        mimeType: 'application/vnd.gremlin-v2.0+json'
    });
    const graph = new Graph();
    return graph.traversal().withRemote(dc);
};
exports.getTraversal = getTraversal;
//# sourceMappingURL=gremlinHelpers.js.map