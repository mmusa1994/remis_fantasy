import { pdf } from "@react-pdf/renderer";
import React from "react";
import PaymentInstructionsPDF from "@/components/PaymentInstructionsPDF";

export const downloadPaymentInstructions = async (leagueType?: string) => {
  try {
    // Detect problematic browsers/webviews
    const userAgent = navigator.userAgent || '';
    const isInstagramBrowser = userAgent.includes('Instagram') || userAgent.includes('FBAN') || userAgent.includes('FBAV');
    const isFacebookBrowser = userAgent.includes('FBAN') || userAgent.includes('FBAV') || userAgent.includes('Facebook');
    const isTwitterBrowser = userAgent.includes('Twitter');
    const isLinkedInBrowser = userAgent.includes('LinkedInApp');
    const isIOSDevice = /iPad|iPhone|iPod/.test(userAgent);
    const isProblematicWebView = isInstagramBrowser || isFacebookBrowser || isTwitterBrowser || isLinkedInBrowser;

    // If in a problematic webview, provide better UX
    if (isProblematicWebView) {
      console.warn("Download attempted in problematic webview");
      
      // Try to generate and show PDF in new tab as fallback
      try {
        const PDFComponent = React.createElement(PaymentInstructionsPDF, {
          leagueType,
        }) as React.ReactElement<any, any>;
        const blob = await pdf(PDFComponent).toBlob();
        const url = URL.createObjectURL(blob);
        
        // Try to open in new tab
        const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
        if (!newWindow) {
          // Fallback: try direct navigation
          window.open(url, '_self');
        }
        
        // Provide user instructions
        throw new Error("WEBVIEW_DOWNLOAD_LIMITATION");
      } catch (err) {
        throw new Error("Za preuzimanje PDF-a, molimo otvorite ovaj link u vašem web browser-u (Chrome, Safari, Firefox) umjesto u aplikaciji.");
      }
    }

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
    
    // Check for problematic webview again in fallback
    const userAgent = navigator.userAgent || '';
    const isProblematicWebView = userAgent.includes('Instagram') || userAgent.includes('FBAN') || 
                                 userAgent.includes('FBAV') || userAgent.includes('Twitter') || 
                                 userAgent.includes('LinkedInApp');
    
    if (isProblematicWebView) {
      throw new Error("PDF se ne može automatski preuzeti u ovoj aplikaciji. Molimo otvorite link u web browser-u ili kontaktirajte nas na muhamed.musa1994@gmail.com za uputstva.");
    }
    
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
