import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { SITE } from "@/lib/site";

export const metadata = {
  metadataBase: new URL(SITE.url),
  title: { default: "Auspex Sports: NBA props and NHL picks with a public record", template: "%s | Auspex Sports" },
  description: SITE.description,
  openGraph: { type: "website", siteName: SITE.name, url: SITE.url, title: "Auspex Sports", description: SITE.description, images: ["/og.png"] },
  twitter: { card: "summary_large_image", site: SITE.xHandle, images: ["/og.png"] },
  icons: { icon: [{ url: "/favicon.ico" }, { url: "/favicon-32.png", sizes: "32x32" }], apple: "/apple-touch-icon.png" },
};
export const viewport = {
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#13233a" }, { media: "(prefers-color-scheme: dark)", color: "#0f1b2c" }],
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main id="main">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
