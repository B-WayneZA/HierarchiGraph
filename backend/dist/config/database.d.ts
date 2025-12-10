import * as gremlin from 'gremlin';
declare const DriverRemoteConnection: typeof gremlin.driver.DriverRemoteConnection;
declare const Graph: typeof gremlin.structure.Graph;
export declare const connectDB: () => Promise<void>;
export declare const disconnectDB: () => Promise<void>;
export declare const getGraphTraversal: () => any;
export declare const getGraph: () => typeof Graph;
export declare const getConnection: () => typeof DriverRemoteConnection;
export {};
//# sourceMappingURL=database.d.ts.map