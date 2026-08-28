import type jsPDF from 'jspdf';


export type AutoTableDocument = jsPDF & {
  lastAutoTable: {
    finalY: number;
    startY?: number;
  };
};
