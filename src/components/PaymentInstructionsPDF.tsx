"use client";

import React from "react";
import { Page, Text, View, Document, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    flexDirection: "column",
    backgroundColor: "#ffffff",
    padding: 40,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    paddingBottom: 20,
    borderBottom: "3px solid #8B4513",
  },
  logoContainer: {
    width: 60,
    height: 60,
    backgroundColor: "#8B4513",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  logoText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    textAlign: "center",
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#DC2626",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 25,
    padding: 15,
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    border: "1px solid #e9ecef",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 10,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  text: {
    fontSize: 12,
    color: "#333333",
    lineHeight: 1.6,
    marginBottom: 5,
  },
  bankSection: {
    marginBottom: 20,
  },
  bankHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    padding: 8,
    backgroundColor: "#ffffff",
    borderRadius: 6,
    border: "1px solid #dee2e6",
  },
  bankName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#495057",
  },
  accountNumber: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#8B4513",
    backgroundColor: "#fff5f5",
    padding: 8,
    borderRadius: 4,
    marginTop: 5,
    textAlign: "center",
    border: "1px solid #fecaca",
  },
  importantNote: {
    backgroundColor: "#fef3c7",
    padding: 15,
    borderRadius: 8,
    border: "2px solid #f59e0b",
    marginBottom: 20,
  },
  importantText: {
    fontSize: 12,
    color: "#92400e",
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 1.6,
  },
  footer: {
    marginTop: 30,
    paddingTop: 20,
    borderTop: "2px solid #8B4513",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  footerText: {
    fontSize: 10,
    color: "#6c757d",
  },
  gradientBox: {
    background: "linear-gradient(135deg, #8B4513, #DC2626)",
    padding: 2,
    borderRadius: 8,
    marginBottom: 20,
  },
  gradientContent: {
    backgroundColor: "#ffffff",
    padding: 15,
    borderRadius: 6,
  },
});

interface PaymentInstructionsPDFProps {
  leagueType?: string;
}

const PaymentInstructionsPDF = ({
  leagueType = "Fantasy Football Liga",
}: PaymentInstructionsPDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>REMIS FANTASY</Text>
      </View>

      <Text style={styles.subtitle}>UPUTSTVA ZA BANKOVNU UPLATU</Text>

      {/* Important Note */}
      <View style={styles.importantNote}>
        <Text style={styles.importantText}>
          VAZNO: Molimo vas da nakon uplate posaljete dokaz o uplati kroz
          registraciju formu na nasoj web stranici.
        </Text>
      </View>

      {/* Payment Purpose */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>SVRHA UPLATE</Text>
        <Text style={styles.text}>Uplata za {leagueType}</Text>
        <Text style={styles.text}>+ Vase ime i prezime</Text>
      </View>

      {/* Personal Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>PODACI PRIMAOCA</Text>
        <Text style={styles.text}>Muhamed Musa</Text>
        <Text style={styles.text}>Marcela Snajdera 4b</Text>
        <Text style={styles.text}>71000 Sarajevo, Bosna i Hercegovina</Text>
        <Text style={styles.text}>Mobilni: 062 211 128</Text>
      </View>

      {/* Domestic Banks */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DOMACE UPLATE (KM)</Text>

        {/* UniCredit Bank */}
        <View style={styles.bankSection}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankName}>UniCredit Bank</Text>
          </View>
          <Text style={styles.accountNumber}>3385702526328703</Text>
        </View>

        {/* Raiffeisen Bank */}
        <View style={styles.bankSection}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankName}>Raiffeisen Bank</Text>
          </View>
          <Text style={styles.accountNumber}>1613000045433885</Text>
        </View>

        {/* ASA Banka */}
        <View style={styles.bankSection}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankName}>ASA Banka</Text>
          </View>
          <Text style={styles.accountNumber}>1341055000007711</Text>
        </View>
      </View>

      {/* International Payments */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>MEDJUNARODNE UPLATE (EUR)</Text>

        <View style={styles.bankSection}>
          <View style={styles.bankHeader}>
            <Text style={styles.bankName}>
              UniCredit Bank (International) - IBAN
            </Text>
          </View>
          <Text style={styles.accountNumber}>BA393387502800979069</Text>
          <Text style={[styles.text, { marginTop: 8, fontWeight: "bold" }]}>
            SWIFT CODE: UNCRBA22XXX
          </Text>
        </View>
      </View>

      {/* Instructions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>DODATNE NAPOMENE</Text>
        <Text style={styles.text}>
          • Molimo da u svrhu uplate navedete naziv lige i vase ime
        </Text>
        <Text style={styles.text}>
          • Nakon uplate, obavezno posaljete dokaz kroz registraciju formu
        </Text>
        <Text style={styles.text}>
          • Uplate se obraduju u roku od 24-48 sati
        </Text>
        <Text style={styles.text}>
          • Za sva pitanja kontaktirajte nas na broj 062 211 128 (Viber,
          WhatsApp)
        </Text>
        <Text style={styles.text}>
          • Ili nam se obratite na DM u instagram profilu: remis_fantasy
        </Text>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © 2025 REMIS Fantasy - Najbolji fantasy football dozivljaj u regionu
        </Text>
      </View>
    </Page>
  </Document>
);

export default PaymentInstructionsPDF;
