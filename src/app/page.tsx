import { SiteHeader } from "@/components/home/site-header";
import { HeroCarousel } from "@/components/home/hero-carousel";
import { HomeSections } from "@/components/home/home-sections";
import { SiteFooter } from "@/components/home/site-footer";

export default function HomePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-white text-shine-ink">
      <SiteHeader />
      <HeroCarousel />
      <HomeSections />
      <SiteFooter />
    </main>
  );
}
