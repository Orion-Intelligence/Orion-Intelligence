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
  endMessageIndex: number;
  markerIndex: number;
  startMessageIndex: number;
  startPromptNumber: number;
  targetPrompt: ScrollRailPrompt;
  title: string;
}
