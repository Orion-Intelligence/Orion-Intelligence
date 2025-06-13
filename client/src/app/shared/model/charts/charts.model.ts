export type GraphType = 'pie' | 'bar';

export interface GraphDataItem {
    name: string;
    value: number;
}

export interface GraphModel {
    type: GraphType;
    title?: string;
    data: GraphDataItem[];
}
