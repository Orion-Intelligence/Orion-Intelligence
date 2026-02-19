import { Color, Node } from 'vis-network';
export interface ExtendedNode extends Node {
    isGroup?: boolean;
    subNodes?: string[];
    nodeType?: string;
    propertyKey?: string | null;
}
export type NodeVisualState = {
    color?: string | Color;
    borderWidth?: number;
    borderWidthSelected?: number;
    image?: string;
};
export type GraphResultItem = {
    vertex: any;
    edge?: any;
    path?: {
        vertices?: any[];
    };
};
export type GraphSessionState = {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
    nodeSearchText: string;
    physicsEnabled: boolean;
    isGraphView: boolean;
    isListingsCollapsed: boolean;
    expandEnabled: boolean;
};
export type GraphSessionTab = {
    id: string;
    name: string;
    state: GraphSessionState;
};
