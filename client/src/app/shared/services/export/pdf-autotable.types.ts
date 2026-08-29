import type jsPDF from 'jspdf';


export type AutoTableDocument = jsPDF & {
  lastAutoTable: {
    finalY: number;
    startY?: number;
  };
};

export function assertAutoTableDocument(document: jsPDF): asserts document is AutoTableDocument {
  if (!('lastAutoTable' in document)) {
    throw new Error('PDF table layout metadata is unavailable');
  }
}
