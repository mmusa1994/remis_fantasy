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

    // Check if device supports downloads properly
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "REMIS_Fantasy_Uputstva_za_Uplatu.pdf";
    
    // Add attributes for better mobile support
    link.setAttribute('target', '_blank');
    link.setAttribute('rel', 'noopener noreferrer');
    
    // Style the link to be invisible
    link.style.display = 'none';

    // For iOS devices, try opening in new tab instead of direct download
    if (isIOSDevice) {
      // Create a new window with the PDF
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        // If popup blocked, fallback to current tab
        window.location.href = url;
      }
    } else {
      // Standard download for other devices
      document.body.appendChild(link);
      
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        link.click();
        // Cleanup after a delay to ensure download started
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
          URL.revokeObjectURL(url);
        }, 100);
      }, 10);
    }
    
  } catch (error) {
    console.error("Error generating PDF:", error);
    // Fallback to static PDF if dynamic generation fails
    const fallbackUrl = "/documents/payment-instructions.pdf";
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
    
    if (isIOSDevice) {
      // For iOS, open in new tab
      const newWindow = window.open(fallbackUrl, '_blank');
      if (!newWindow) {
        window.location.href = fallbackUrl;
      }
    } else {
      // Standard download for other devices
      const link = document.createElement("a");
      link.href = fallbackUrl;
      link.download = "REMIS_Fantasy_Uputstva_za_Uplatu.pdf";
      link.setAttribute('target', '_blank');
      link.style.display = 'none';
      
      document.body.appendChild(link);
      setTimeout(() => {
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) {
            document.body.removeChild(link);
          }
        }, 100);
      }, 10);
    }
  }
};
