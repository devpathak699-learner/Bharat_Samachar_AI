import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bharat Samachar | भारत समाचार – AI Multilingual News",
  description:
    "AI-powered platform that translates and culturally adapts news into 22 Indian languages. Powered by AWS Bedrock, Polly, and DynamoDB.",
  keywords: "Indian news, multilingual, AI translation, Hindi news, Tamil news, Bedrock AI, Bharat",
  openGraph: {
    title: "Bharat Samachar – AI Multilingual News for India",
    description: "Every citizen of Bharat deserves information in their language.",
    locale: "en_IN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>{children}</body>
    </html>
  );
}
