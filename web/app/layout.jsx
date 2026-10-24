import "./globals.css";
import localFont from "next/font/local";
import Script from "next/script";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

const marcellus = localFont({
  src: "../node_modules/@fontsource/marcellus/files/marcellus-latin-400-normal.woff2",
  variable: "--font-display",
  display: "swap",
  weight: "400",
  adjustFontFallback: "Times New Roman",
});

const archivo = localFont({
  src: "../node_modules/@fontsource-variable/archivo/files/archivo-latin-wdth-normal.woff2",
  variable: "--font-text",
  display: "swap",
  adjustFontFallback: "Arial",
});

const HOME_TITLE = "Auspex Sports: NBA props and NHL picks with a public record";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: HOME_TITLE, template: "%s | Auspex Sports" },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name, url: SITE.url, title: HOME_TITLE, description: SITE.description },
  twitter: { card: "summary_large_image", site: SITE.xHandle, title: HOME_TITLE, description: SITE.description },
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32.png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
};
export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#13233a" }, { media: "(prefers-color-scheme: dark)", color: "#0f1b2c" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${marcellus.variable} ${archivo.variable}`}>
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <Script src="/visits.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
