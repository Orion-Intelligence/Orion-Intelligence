import { LeakCallbackModel } from '../leak/leak.callback.model';
import { ExploitCallbackModel } from '../exploit/exploit.callback.model';
import { ChatCallbackModel } from '../chat/chat.callback.model';
import { GeneralCallbackModel } from '../general/general.callback.model';
import { SocialCallbackModel } from '../social/social.callback.model';
import { DefacementCallbackModel } from '../defacement/defacement.callback.model';
import { StealerLogCallbackModel } from '../credentials/credential.callback.model';
import { SearchDynamicEmailCallbackModel } from '../../api/email/search_dynamic_email_callback_model';
import { UrlScanMeta } from '../../security-scan/security.scan.results.model';
export class ConsolidatedCallbackModel {
    leak_model?: LeakCallbackModel;
    exploit_model?: ExploitCallbackModel;
    chat_model?: ChatCallbackModel;
    generic_model?: GeneralCallbackModel;
    social_model?: SocialCallbackModel;
    defacement_model?: DefacementCallbackModel;
    stealer_model?: StealerLogCallbackModel;
    tracking_model?: LeakCallbackModel;
    news_model?: LeakCallbackModel;
    constructor(init?: Partial<ConsolidatedCallbackModel>) {
        this.leak_model = init?.leak_model ? new LeakCallbackModel(init.leak_model) : undefined;
        this.exploit_model = init?.exploit_model ? new ExploitCallbackModel(init.exploit_model) : undefined;
        this.chat_model = init?.chat_model ? new ChatCallbackModel(init.chat_model) : undefined;
        this.generic_model = init?.generic_model ? new GeneralCallbackModel(init.generic_model) : undefined;
        this.social_model = init?.social_model ? new SocialCallbackModel(init.social_model) : undefined;
        this.defacement_model = init?.defacement_model ? new DefacementCallbackModel(init.defacement_model) : undefined;
        this.stealer_model = init?.stealer_model ? new StealerLogCallbackModel(init.stealer_model) : undefined;
        this.tracking_model = init?.tracking_model ? new LeakCallbackModel(init.tracking_model) : undefined;
        this.news_model = init?.news_model ? new LeakCallbackModel(init.news_model) : undefined;
    }
}
export type ConsolidatedLiveApis = {
    type: 'user' | 'social' | 'cracked';
    q1: string;
    q2?: string;
};
export type ConsolidatedLiveApiResults = {
    input: ConsolidatedLiveApis;
    status: 'pending' | 'success' | 'error';
    resultData: SearchDynamicEmailCallbackModel | null;
    errorMessage: string | null;
};
export type ConsolidatedScanResults = {
    domain: string;
    scanType: 'basic' | 'seo' | 'repo';
    meta: UrlScanMeta | null;
    grade: string;
    hasError: boolean;
    errorMessage: string;
};
