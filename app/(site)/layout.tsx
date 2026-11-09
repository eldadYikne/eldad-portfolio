import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import VoiceRealtimeAgent from "@/components/VoiceRealtimeAgent";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      {/* <FloatingChat /> */}
      <VoiceRealtimeAgent />
      <Footer />
    </div>
  );
}
