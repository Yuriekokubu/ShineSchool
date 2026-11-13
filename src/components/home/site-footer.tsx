import Link from "next/link";
import { Star } from "lucide-react";

export function SiteFooter() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="mx-auto flex max-w-[1600px] flex-col items-center justify-between gap-5 px-5 py-8 sm:px-8 md:flex-row lg:px-16">
        <Link href="/" className="flex items-center gap-3 font-extrabold text-shine-ink">
          <span className="grid size-10 place-items-center rounded-full bg-shine-yellow text-shine-navy"><Star size={23} fill="currentColor" /></span>
          <span className="text-xl">ShineSchool</span>
        </Link>
        <p className="text-center text-xs text-slate-400">© {new Date().getFullYear()} ShineSchool. พื้นที่แห่งการเรียนรู้และการเติบโต</p>
      </div>
    </footer>
  );
}