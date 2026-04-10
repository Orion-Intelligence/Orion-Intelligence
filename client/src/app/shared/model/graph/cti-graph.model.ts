import { Color, Node } from 'vis-network';
type GraphNodeColor = string | Color;
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
export interface GraphSessionState {
    selectedType: string;
    singleInput: string;
    propertyType: string;
    propertyValue: string;
    maxEdge: number;
    maxDepth: number;
    isSidebarCollapsed: boolean;
    graphData: GraphResultItem[] | null;
    groupExpandedState: Record<string, boolean>;
    limitReached: boolean;
    nodeSearchText: string;
    physicsEnabled: boolean;
    isGraphView: boolean;
    isListingsCollapsed: boolean;
    expandEnabled: boolean;
}
export interface GraphSessionTab {
    id: string;
    name: string;
    state: GraphSessionState;
}
