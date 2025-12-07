import type { Metadata } from "next";
import { Itim } from "next/font/google";
import "./globals.css";
import MusicPlayer from "./components/MusicPlayer";
import { LanguageProvider } from "./context/LanguageContext";

const itim = Itim({
  weight: "400",
  subsets: ["latin", "thai"],
  variable: "--font-itim",
});

export const metadata: Metadata = {
  title: "Glai Jai - Deep Talking",
  description: "Card game for deep conversations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body
        className={`${itim.variable} font-itim antialiased`}
        suppressHydrationWarning
      >
        <LanguageProvider>
          {children}
          <MusicPlayer />
        </LanguageProvider>
      </body>
    </html>
  );
}
