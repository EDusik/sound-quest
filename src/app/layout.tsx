import Script from "next/script";
import { Geist, Geist_Mono } from "next/font/google";
import { Cinzel } from "next/font/google";
import "./globals.css";
import { ConditionalFooter } from "@/components/layout/ConditionalFooter";
import { SkipToContent } from "@/components/a11y/SkipToContent";
import { JsonLd } from "@/components/seo/JsonLd";
import { Providers } from "@/components/layout/Providers";
import { siteMetadata } from "@/lib/seo/seo";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const cinzel = Cinzel({
  variable: "--font-cinzel",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

export const metadata = siteMetadata;

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#EEF2F7" },
    { media: "(prefers-color-scheme: dark)", color: "#0F0E17" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {supabaseUrl && (
          <link rel="preconnect" href={supabaseUrl} />
        )}
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${cinzel.variable} flex min-h-dvh flex-col antialiased`}
      >
        <JsonLd />
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=localStorage.getItem("theme");var dark=t!=="light";if(dark)document.documentElement.classList.add("dark");else document.documentElement.classList.remove("dark");var href=dark?"/icon.svg":"/icon-dark.svg";var links=document.querySelectorAll('link[rel="icon"], link[rel="shortcut icon"]');for(var i=0;i<links.length;i++)links[i].href=href;})();`,
          }}
        />
        <Providers>
          <SkipToContent />
          <main
            id="main-content"
            className="min-h-0 flex-1 overflow-auto bg-background"
            tabIndex={-1}
          >
            {children}
          </main>
          <ConditionalFooter />
        </Providers>
      </body>
    </html>
  );
}
