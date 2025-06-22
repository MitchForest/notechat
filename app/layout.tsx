import type { Metadata } from "next";
import { Inter, JetBrains_Mono as JetBrainsMono } from "next/font/google";
import "@/app/globals.css";
import "@/features/editor/styles/spellcheck.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";
import { AppShellProvider } from "@/components/layout/app-shell-context";
import { Toaster } from "@/components/ui/sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const jetbrainsMono = JetBrainsMono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "NoteChat.AI - Your AI-Powered Second Brain",
  description: "A Notion-style editor with deep AI integration that learns how you write and helps you think better. Features adaptive ghost completions, AI chat, and advanced grammar checking.",
  keywords: ["AI writing assistant", "note-taking", "block editor", "AI chat", "grammar checker", "ghost completions"],
  authors: [{ name: "NoteChat Team" }],
  creator: "NoteChat",
  publisher: "NoteChat",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: "NoteChat.AI - Your AI-Powered Second Brain",
    description: "A Notion-style editor with deep AI integration that learns how you write and helps you think better.",
    type: "website",
    url: "https://notechat.ai",
    siteName: "NoteChat.AI",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "NoteChat.AI - AI-Powered Note Taking",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "NoteChat.AI - Your AI-Powered Second Brain",
    description: "A Notion-style editor with deep AI integration that learns how you write and helps you think better.",
    images: ["/og-image.png"],
    creator: "@notechat_ai",
  },
  alternates: {
    canonical: "https://notechat.ai",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "min-h-screen bg-background font-sans antialiased",
          inter.variable,
          jetbrainsMono.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AppShellProvider>
            {children}
            <Toaster />
          </AppShellProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
