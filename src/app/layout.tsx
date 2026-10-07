import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Sans } from "next/font/google";
import { Analytics } from "@/components/analytics";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { MotionProvider } from "@/components/motion-provider";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import { THEME_COLOR, themeInitScript } from "@/lib/theme";
import "./globals.css";

// Display: Archivo set wide (wdth 125) and heavy. Mass, not the condensed gym cliché.
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
});

// Body: IBM Plex Sans. Plain, legible, clearly distinct from the display face.
const plex = IBM_Plex_Sans({
  variable: "--font-plex",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  ),
  title: {
    default: `${site.name} | ${site.tagline}`,
    template: `%s | ${site.name}`,
  },
  ...pageMetadata({ description: site.description, card: "home" }),
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: THEME_COLOR.day },
    { media: "(prefers-color-scheme: dark)", color: THEME_COLOR.evening },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // The head script sets the theme class before paint, so the server markup
    // can differ from the client's on <html> only.
    <html
      lang="en"
      className={`${archivo.variable} ${plex.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static, first-party theme script; must run before paint
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body className="flex min-h-dvh flex-col">
        <a
          href="#main"
          className="sr-only z-50 rounded-sm bg-iron px-4 py-3 text-chalk focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <MotionProvider>
          <SiteHeader />
          <main id="main" tabIndex={-1} className="flex-1 outline-none">
            {children}
          </main>
          <SiteFooter />
        </MotionProvider>
        <Analytics />
      </body>
    </html>
  );
}
