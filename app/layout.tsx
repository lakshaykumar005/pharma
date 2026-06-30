import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono, Bebas_Neue } from "next/font/google";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  variable: "--font-plex-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const bebas = Bebas_Neue({
  variable: "--font-bebas",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://anthem-aapaavani.vercel.app"),
  title: "Anthem Biosciences — Project Command Center",
  description:
    "Live ETP Demonstration programme tracker by Aapaavani Environmental Solutions — plan, timeline, team and client sign-off in one place.",
  applicationName: "Anthem Command Center",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Anthem Command Center",
    title: "Anthem Biosciences — Project Command Center",
    description:
      "Live ETP Demonstration programme tracker by Aapaavani Environmental Solutions — plan, timeline, team and client sign-off.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Anthem Biosciences — Project Command Center",
    description: "Live ETP Demonstration programme tracker by Aapaavani Environmental Solutions.",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0c",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${plexSans.variable} ${plexMono.variable} ${bebas.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
