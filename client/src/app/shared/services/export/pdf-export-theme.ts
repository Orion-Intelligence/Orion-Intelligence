export type PdfRgb = [number, number, number];

export interface PdfExportTheme {
  whiteRgb: PdfRgb;
  coverBandRgb: PdfRgb;
  coverSubtitleRgb: PdfRgb;
  coverPanelRgb: PdfRgb;
  coverMetricRgb: PdfRgb;
  coverPanelBorderRgb: PdfRgb;
  coverLabelRgb: PdfRgb;
  dividerRgb: PdfRgb;
  headerAccentRgb: PdfRgb;
  sectionHeaderRgb: PdfRgb;
  headerBackgroundRgb: PdfRgb;
  textPrimaryRgb: PdfRgb;
  textBodyRgb: PdfRgb;
  textSecondaryRgb: PdfRgb;
  textMutedRgb: PdfRgb;
  footerTextRgb: PdfRgb;
  softTextRgb: PdfRgb;
  tableRowBgRgb: PdfRgb;
  tableRowAltBgRgb: PdfRgb;
  tableBorderRgb: PdfRgb;
  headerRowFillRgb: PdfRgb;
  firstColumnFillRgb: PdfRgb;
  defaultHeaderRowFillRgb: PdfRgb;
  defaultFirstColumnFillRgb: PdfRgb;
  mediumBorderRgb: PdfRgb;
  backgroundPatternRgb: PdfRgb;
  sectionRadius: number;
  tableBorderWidth: number;
}

export const PDF_EXPORT_THEME: PdfExportTheme = {
  whiteRgb: [255, 255, 255],
  coverBandRgb: [15, 23, 42],
  coverSubtitleRgb: [71, 85, 105],
  coverPanelRgb: [248, 250, 252],
  coverMetricRgb: [248, 250, 252],
  coverPanelBorderRgb: [203, 213, 225],
  coverLabelRgb: [71, 85, 105],
  dividerRgb: [14, 116, 144],
  headerAccentRgb: [14, 116, 144],
  sectionHeaderRgb: [15, 76, 129],
  headerBackgroundRgb: [248, 250, 252],
  textPrimaryRgb: [15, 23, 42],
  textBodyRgb: [30, 41, 59],
  textSecondaryRgb: [71, 85, 105],
  textMutedRgb: [100, 116, 139],
  footerTextRgb: [51, 65, 85],
  softTextRgb: [226, 232, 240],
  tableRowBgRgb: [255, 255, 255],
  tableRowAltBgRgb: [248, 250, 252],
  tableBorderRgb: [226, 232, 240],
  headerRowFillRgb: [226, 232, 240],
  firstColumnFillRgb: [248, 250, 252],
  defaultHeaderRowFillRgb: [226, 232, 240],
  defaultFirstColumnFillRgb: [248, 250, 252],
  mediumBorderRgb: [203, 213, 225],
  backgroundPatternRgb: [248, 250, 252],
  sectionRadius: 5,
  tableBorderWidth: 0.35
};
