/**
 * Convert a Gremlin vertex to a plain object
 */
export declare const vertexToObject: (vertex: any) => any;
/**
 * Convert Gremlin edge to a plain object
 */
export declare const edgeToObject: (edge: any) => any;
/**
 * Generate Gravatar URL from email
 */
export declare const getGravatarUrl: (email: string, size?: number) => string;
/**
 * Helper to get a vertex by ID
 */
export declare const getVertexById: (vertexId: string, label: string) => Promise<any>;
/**
 * Helper to find a vertex by property
 */
export declare const findVertexByProperty: (label: string, property: string, value: any) => Promise<any>;
/**
 * Helper to check if a vertex exists by property
 */
export declare const vertexExistsByProperty: (label: string, property: string, value: any) => Promise<boolean>;
import gremlin from 'gremlin';
export declare const getTraversal: () => gremlin.process.GraphTraversalSource<gremlin.process.GraphTraversal>;
//# sourceMappingURL=gremlinHelpers.d.ts.map