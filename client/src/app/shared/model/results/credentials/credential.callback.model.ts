import { Suggestion } from "../shared/common-result";
import { initCallbackModel } from "../callback.init";
export class StealerLogResultItem {
    type?: string;
    raw?: string;
    channel?: string;
    file?: string;
    timestamp?: string;
    [key: string]: any;
    constructor(init?: Partial<StealerLogResultItem>) {
        Object.assign(this, init);
    }
}
export class StealerLogCallbackModel {
    Result!: StealerLogResultItem[];
    Page_Count!: number;
    Suggestions!: Suggestion[];
    Total_Hits!: number;
    constructor(init?: Partial<StealerLogCallbackModel>) {
        this.Result = [];
        this.Page_Count = 0;
        this.Suggestions = [];
        this.Total_Hits = 0;
        if (init) {
            initCallbackModel(this, init, r => new StealerLogResultItem(r));
        }
    }
}
