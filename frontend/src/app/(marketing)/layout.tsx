import { TopNavigation } from "@/components/layout/top-navigation";
import Footer from "@/components/layout/Footer";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopNavigation />
      {children}
      <Footer />
    </div>
  );
}
