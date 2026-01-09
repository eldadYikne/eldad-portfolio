import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import "../styles/globals.css";
import FloatingChat from "@/components/floatingChat";
import VoiceRealtimeAgent from "../components/VoiceRealtimeAgent";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Eldad Yikne | Full-Stack Developer",
  description:
    "Full-Stack Developer with expertise in NextJS, React, Vue, Angular, Node.js, and AI integration. Currently working at Codere Online.",
  keywords: [
    "Full-Stack Developer",
    "React",
    "Next.js",
    "Node.js",
    "TypeScript",
    "AI Integration",
    "OpenAI",
  ],
  authors: [{ name: "Eldad Yikne" }],
  openGraph: {
    title: "Eldad Yikne | Full-Stack Developer",
    description:
      "Full-Stack Developer specializing in modern web technologies and AI-driven architecture",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <div className="relative flex min-h-screen flex-col">
              <Header />
              <main className="flex-1">{children}</main>
              {/* <FloatingChat /> */}
                <VoiceRealtimeAgent/>
              <Footer />
            </div>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
