import { Suggestion } from "../shared/common-result";
import { initCallbackModel } from '../callback.init';
import { DefacementResultItem } from '../defacement/defacement.callback.model';

export class StealerLogResultItem {
  type?: string;
  raw?: string;
  channel?: string;
  file?: string;
  log_hash?: string;
  timestamp?: string;
  [key: string]: any;

  constructor(init?: Partial<StealerLogResultItem>) {
    Object.assign(this, init);
  }
}

export class StealerLogCallbackModel {
  Result: StealerLogResultItem[] = [];
  Page_Count: number = 0;
  Suggestions: Suggestion[] = [];
  Total_Hits: number = 0;

  constructor(init?: Partial<StealerLogCallbackModel>) {
    if (init) {
      initCallbackModel(this, init, r => new StealerLogResultItem(r));
    }
  }
}
