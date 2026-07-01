import { Node } from 'vis-network';
type GraphNodeColor = NonNullable<Node['color']>;
export interface ExtendedNode extends Node {
    isGroup?: boolean;
    subNodes?: string[];
    nodeType?: string;
    propertyKey?: string | null;
}
export interface NodeVisualState {
    color?: GraphNodeColor;
    borderWidth?: number;
    borderWidthSelected?: number;
    image?: string;
}
export interface GraphResultItem {
    vertex: any;
    edge?: any;
    path?: {
        vertices?: any[];
    };
}
export interface CtiGraphFilters {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
}
