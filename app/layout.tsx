import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "All Of My Projects",
  description: "A single portfolio hub for all local projects.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
