export interface TourStep {
  elementId: string;
  additionalElementIds?: string[];
  title: string;
  description: string;
  activateSelector?: string;
  waitForSelector?: string;
  scrollIntoView?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  padding?: number;
  paddingTop?: number;
  paddingRight?: number;
  paddingBottom?: number;
  paddingLeft?: number;
  captureValueOnEnter?: boolean;
  endOnEnter?: boolean;
  inputSelector?: string;
  presetValue?: string;
  disableInput?: boolean;
  disableSelectors?: string[];
  triggerSubmitOnShow?: boolean;
  triggerSubmitOnNext?: boolean;
  sidebarState?: 'expanded' | 'collapsed';
  profileMenuState?: 'open' | 'closed';
  showWhenSelector?: string;
  targetInteractive?: boolean;
}

export type DemoTourConfig = Record<string, TourStep[]>;
