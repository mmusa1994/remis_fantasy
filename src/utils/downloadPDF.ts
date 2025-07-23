import { pdf } from "@react-pdf/renderer";
import React from "react";
import PaymentInstructionsPDF from "@/components/PaymentInstructionsPDF";

export const downloadPaymentInstructions = async (leagueType?: string) => {
  try {
    // Generate the PDF blob using React PDF
    const PDFComponent = React.createElement(PaymentInstructionsPDF, {
      leagueType,
    }) as React.ReactElement<any, any>;
    const blob = await pdf(PDFComponent).toBlob();

    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "REMIS_Fantasy_Uputstva_za_Uplatu.pdf";

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to static PDF if dynamic generation fails
    const link = document.createElement("a");
    link.href = "/documents/payment-instructions.pdf";
    link.download = "REMIS_Fantasy_Uputstva_za_Uplatu.pdf";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
