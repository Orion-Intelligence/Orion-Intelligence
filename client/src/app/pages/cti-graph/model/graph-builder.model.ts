export enum GraphSearchMode {
  All = 'all',
  Cluster = 'cluster',
  Property = 'property',
}

export enum GraphBuilderLogicalOperator {
  And = '&&',
  Or = '||',
}

export class GraphSearchOptionModel {
  key = '';
  label = '';
  mode: `${GraphSearchMode}` = GraphSearchMode.All;
  propertyType?: string;
  clusterValue?: string;
  placeholder = '';

  constructor(init?: Partial<GraphSearchOptionModel>) {
    Object.assign(this, init);
  }
}

export class GraphAdvancedFilterModel {
  id = '';
  optionKey = '';
  value = '';
  operator: `${GraphBuilderLogicalOperator}` = GraphBuilderLogicalOperator.And;

  constructor(init?: Partial<GraphAdvancedFilterModel>) {
    Object.assign(this, init);
  }
}

export class GraphAdvancedFilterChipModel {
  id = '';
  label = '';

  constructor(init?: Partial<GraphAdvancedFilterChipModel>) {
    Object.assign(this, init);
  }
}

export class GraphSearchRequestModel {
  dataPointType = '';
  modelType = '';
  queryValues: string[] = [];
  operator?: `${GraphBuilderLogicalOperator}`;

  constructor(init?: Partial<GraphSearchRequestModel>) {
    Object.assign(this, init);
    this.queryValues = [...(init?.queryValues ?? [])];
  }
}
