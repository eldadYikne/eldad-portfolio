import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/lib/contexts/auth-context";
import "../styles/globals.css";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Eldad Yikne | CTO & Full-Stack Architect",
  description:
    "CTO & Full-Stack Architect. Explore an interactive 3D physics portfolio: experience, AI products, computer vision and more.",
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
    title: "Eldad Yikne | CTO & Full-Stack Architect",
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
            {children}
          </AuthProvider>
        </ThemeProvider>
        <Script
          strategy="afterInteractive"
          src="https://cdn.enable.co.il/licenses/enable-L53141et9topec3t-0126-77369/init.js"
        />
      </body>
    </html>
  );
}
