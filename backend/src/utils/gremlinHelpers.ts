import { getGraphTraversal } from '../config/database';
import crypto from 'crypto';

/**
 * Convert a Gremlin vertex to a plain object
 */
export const vertexToObject = (vertex: any): any => {
  if (!vertex) return null;
  
  const obj: any = {
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

/**
 * Convert Gremlin edge to a plain object
 */
export const edgeToObject = (edge: any): any => {
  if (!edge) return null;
  
  return {
    id: edge.id.toString(),
    label: edge.label,
    inV: edge.inV.toString(),
    outV: edge.outV.toString(),
  };
};

/**
 * Generate Gravatar URL from email
 */
export const getGravatarUrl = (email: string, size: number = 200): string => {
  const hash = crypto.createHash('sha256').update(email.toLowerCase().trim()).digest('hex');
  const defaultAvatar = process.env.GRAVATAR_DEFAULT || 'identicon';
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultAvatar}`;
};

/**
 * Helper to get a vertex by ID
 */
export const getVertexById = async (vertexId: string, label: string): Promise<any> => {
  const g = getGraphTraversal();
  const result = await g.V(vertexId).hasLabel(label).valueMap(true).toList();
  return result.length > 0 ? result[0] : null;
};

/**
 * Helper to find a vertex by property
 */
export const findVertexByProperty = async (
  label: string,
  property: string,
  value: any
): Promise<any> => {
  const g = getGraphTraversal();
  const result = await g.V().hasLabel(label).has(property, value).valueMap(true).toList();
  return result.length > 0 ? result[0] : null;
};

/**
 * Helper to check if a vertex exists by property
 */
export const vertexExistsByProperty = async (
  label: string,
  property: string,
  value: any
): Promise<boolean> => {
  const g = getGraphTraversal();
  const count = await g.V().hasLabel(label).has(property, value).count().next();
  return count.value > 0;
};

import gremlin from 'gremlin';

const DriverRemoteConnection = gremlin.driver.DriverRemoteConnection;
const Graph = gremlin.structure.Graph;

export const getTraversal = () => {
  const dc = new DriverRemoteConnection(process.env.NEPTUNE_ENDPOINT!, {
    mimeType: 'application/vnd.gremlin-v2.0+json'
  });

  const graph = new Graph();
  return graph.traversal().withRemote(dc);
};
