import type { Metadata } from "next";
import { Inter, Sora, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { NavBar } from "@/components/NavBar";
import { UIProvider } from "@/components/providers";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
// Display face for hero numbers / headlines.
const sora = Sora({ subsets: ["latin"], variable: "--font-display", weight: ["600", "700", "800"] });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Fiduciary — Get paid today, not in 60 days",
  description: "AI agents compete to factor your invoice. The better the agent, the less it charges.",
};

// Apply the stored theme before first paint to avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('fid-theme');var d=t?t==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;if(d)document.documentElement.classList.add('dark');}catch(e){}})();`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable} ${mono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen bg-bg font-sans text-fg antialiased">
        <UIProvider>
          <NavBar />
          <main className="mx-auto max-w-6xl px-5 py-10 sm:px-6">{children}</main>
        </UIProvider>
      </body>
    </html>
  );
}
