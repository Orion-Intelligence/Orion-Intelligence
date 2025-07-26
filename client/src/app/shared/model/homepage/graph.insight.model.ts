export interface GraphBucket {
  key: string;
  count: number;
}

export interface GraphAggregation {
  aggregation_name: string;
  index: string;
  buckets: GraphBucket[];
}

export type GraphInsightCallbackModel = [true, GraphAggregation[]] | [false, null];
