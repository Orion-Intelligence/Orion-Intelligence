import { Node } from 'vis-network';
type GraphNodeColor = NonNullable<Node['color']>;
export interface ExtendedNode extends Node {
    isGroup?: boolean;
    subNodes?: string[];
    nodeType?: string;
    nodeClass?: string;
    clusterId?: string;
    docId?: string;
    propertyKey?: string | null;
    rawLabel?: string;
    nodeInfoHtml?: string;
    hiddenByDefault?: boolean;
    degree?: number;
}
export interface NodeVisualState {
    color?: GraphNodeColor;
    borderWidth?: number;
    borderWidthSelected?: number;
    image?: string;
}
export interface GraphResultItem {
    vertex: {
        _id?: string;
        _key?: string;
        type?: string;
        node_class?: string;
        label?: string;
        display_value?: string;
        value?: string;
        title?: string;
        doc_id?: string;
        m_document_id?: string;
        cluster_id?: string;
        hidden_by_default?: boolean;
        [key: string]: any;
    };
    edge?: {
        _id?: string;
        _from?: string;
        _to?: string;
        type?: string;
        edge_type?: string;
        label?: string;
        relationship_type?: string;
        confidence?: number;
        [key: string]: any;
    };
    path?: {
        vertices?: any[];
        edges?: any[];
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
export interface CtiGraphLegendItem {
    key: string;
    label: string;
    color: string;
    swatchClass?: string;
    count: number;
}
export interface CtiGraphStats {
    visibleNodes: number;
    totalNodes: number;
    visibleEdges: number;
    totalEdges: number;
    hiddenNodes: number;
}
