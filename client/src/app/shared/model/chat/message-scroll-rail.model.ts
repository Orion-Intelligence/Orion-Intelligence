export interface ScrollRailMessage {
  sender: string;
  text?: string | null;
}

export interface ScrollRailPrompt {
  messageIndex: number;
  promptNumber: number;
  title: string;
}

export interface ScrollRailMarker {
  endPromptNumber: number;
  markerIndex: number;
  startPromptNumber: number;
  targetPrompt: ScrollRailPrompt;
  title: string;
}
