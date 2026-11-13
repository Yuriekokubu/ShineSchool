"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Star } from "lucide-react";

const links = [
  { label: "เกี่ยวกับเรา", href: "#about" },
  { label: "ระดับชั้น", href: "#levels" },
  { label: "ข่าวสาร", href: "#news" },
  { label: "ติดต่อ", href: "#contact" },
];

export function SiteHeader() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="relative z-50 bg-white">
      <div className="mx-auto flex h-[88px] max-w-[1900px] items-center justify-between px-5 sm:px-8 lg:px-16">
        <Link href="/" aria-label="ShineSchool หน้าแรก" className="flex shrink-0 items-center gap-3">
          <span className="grid size-14 place-items-center rounded-full bg-shine-yellow text-shine-navy shadow-sm">
            <Star size={35} fill="currentColor" strokeWidth={1.5} />
          </span>
          <span className="text-[25px] font-extrabold tracking-tight text-shine-ink sm:text-[30px]">
            ShineSchool
          </span>
        </Link>

        <nav className="hidden items-center gap-9 lg:flex" aria-label="เมนูหลัก">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="text-lg font-medium text-shine-navy transition hover:text-amber-500">
              {link.label}
            </a>
          ))}
          <Link href="/admissions" className="rounded-full bg-shine-navy px-9 py-4 text-lg font-bold !text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-[#142657]">
            สมัครเรียน
          </Link>
        </nav>

        <button
          type="button"
          className="grid size-11 place-items-center rounded-xl text-shine-navy hover:bg-slate-100 lg:hidden"
          aria-label={mobileOpen ? "ปิดเมนู" : "เปิดเมนู"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((open) => !open)}
        >
          {mobileOpen ? <X size={25} /> : <Menu size={25} />}
        </button>
      </div>

      {mobileOpen && (
        <nav className="absolute inset-x-0 top-full border-t border-slate-100 bg-white px-6 py-5 shadow-xl lg:hidden" aria-label="เมนูมือถือ">
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {links.map((link) => (
              <a key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="rounded-xl px-4 py-3 font-semibold text-shine-navy hover:bg-amber-50">
                {link.label}
              </a>
            ))}
            <Link href="/admissions" onClick={() => setMobileOpen(false)} className="mt-2 rounded-full bg-shine-navy px-5 py-3 text-center font-bold !text-white">
              สมัครเรียน
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}