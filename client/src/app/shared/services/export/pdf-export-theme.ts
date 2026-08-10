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
  recordDividerRgb: PdfRgb;
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
  coverBandRgb: [21, 40, 63],
  coverSubtitleRgb: [102, 115, 132],
  coverPanelRgb: [255, 255, 255],
  coverMetricRgb: [247, 247, 248],
  coverPanelBorderRgb: [205, 212, 220],
  coverLabelRgb: [102, 115, 132],
  dividerRgb: [165, 35, 54],
  headerAccentRgb: [165, 35, 54],
  sectionHeaderRgb: [165, 35, 54],
  headerBackgroundRgb: [255, 255, 255],
  textPrimaryRgb: [21, 40, 63],
  textBodyRgb: [37, 49, 66],
  textSecondaryRgb: [102, 115, 132],
  textMutedRgb: [102, 115, 132],
  footerTextRgb: [91, 102, 117],
  softTextRgb: [205, 212, 220],
  tableRowBgRgb: [255, 255, 255],
  tableRowAltBgRgb: [255, 255, 255],
  tableBorderRgb: [205, 212, 220],
  recordDividerRgb: [222, 227, 232],
  headerRowFillRgb: [247, 247, 248],
  firstColumnFillRgb: [255, 255, 255],
  defaultHeaderRowFillRgb: [247, 247, 248],
  defaultFirstColumnFillRgb: [255, 255, 255],
  mediumBorderRgb: [205, 212, 220],
  backgroundPatternRgb: [255, 255, 255],
  sectionRadius: 0,
  tableBorderWidth: 0.4
};
