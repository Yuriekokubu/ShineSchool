"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, GraduationCap, Heart, Lightbulb, Star } from "lucide-react";

const slides = [
  {
    eyebrow: "เปิดรับสมัครนักเรียนใหม่",
    title: "โรงเรียนที่ทำให้ทุกคน",
    highlight: "เปล่งประกาย",
    description: "ที่ ShineSchool เด็กทุกคนได้เรียนรู้อย่างมีความสุข มีครูที่ใส่ใจ และมีพื้นที่ให้ค้นพบสิ่งที่ตัวเองรัก",
    primary: "สมัครเรียน",
    secondary: "รู้จักโรงเรียนของเรา",
    href: "/admissions",
    icon: GraduationCap,
    artTitle: "A bright place to grow",
    artText: "เรียนรู้ในแบบของตัวเอง",
  },
  {
    eyebrow: "ค้นพบความสามารถที่แตกต่าง",
    title: "ทุกความสนใจ",
    highlight: "มีคุณค่า",
    description: "เปิดโอกาสให้เด็ก ๆ ได้ทดลอง ตั้งคำถาม และค้นพบศักยภาพของตัวเองผ่านประสบการณ์การเรียนรู้ที่หลากหลาย",
    primary: "ดูระดับชั้นเรียน",
    secondary: "แนวทางการเรียนรู้",
    href: "/admissions",
    icon: Lightbulb,
    artTitle: "Discover your talent",
    artText: "กล้าคิด กล้าลอง และเติบโต",
  },
  {
    eyebrow: "เติบโตไปด้วยกัน",
    title: "เพราะทุกก้าว",
    highlight: "สำคัญเสมอ",
    description: "เราร่วมเดินทางไปกับผู้เรียนและครอบครัว ด้วยความเข้าใจ ความใส่ใจ และสภาพแวดล้อมที่เป็นมิตร",
    primary: "พูดคุยกับเรา",
    secondary: "อ่านเรื่องราวของเรา",
    href: "/admissions",
    icon: Heart,
    artTitle: "Grow with confidence",
    artText: "พื้นที่ปลอดภัยสำหรับการเติบโต",
  },
];

export function HeroCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const activeSlide = slides[activeIndex];
  const IllustrationIcon = activeSlide.icon;

  const goTo = (index: number) => {
    setActiveIndex((index + slides.length) % slides.length);
  };

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(timer);
  }, []);

  return (
    <section className="relative isolate overflow-hidden bg-white">
      <div className="pointer-events-none absolute -right-24 top-8 -z-10 size-[440px] rounded-full bg-shine-yellow/90 sm:right-[-70px] sm:size-[560px] lg:right-[8%] lg:top-12" />
      <div className="mx-auto grid min-h-[650px] max-w-[1900px] items-center gap-8 px-5 py-12 sm:px-8 lg:min-h-[760px] lg:grid-cols-[1.08fr_.92fr] lg:gap-12 lg:px-16 lg:py-16">
        <div className="relative z-10 max-w-[850px]">
          <div className="mb-7 inline-flex items-center gap-3 rounded-full bg-shine-yellow-soft px-6 py-3 text-sm font-bold text-[#654d08] sm:text-lg">
            <Star size={19} />
            {activeSlide.eyebrow}
          </div>

          <div key={activeIndex} className="animate-[shine-in_.45s_ease-out]">
            <h1 className="text-[clamp(2.8rem,5.4vw,6.2rem)] font-extrabold leading-[1.18] tracking-[-.055em] text-shine-ink">
              {activeSlide.title}
              <span className="mt-2 inline-block rounded-[28px] bg-shine-yellow px-5 py-2 text-shine-navy sm:px-7 sm:py-3">
                {activeSlide.highlight}
              </span>
            </h1>
            <p className="mt-7 max-w-[760px] text-lg leading-[1.9] text-slate-600 sm:text-xl lg:text-2xl">
              {activeSlide.description}
            </p>
          </div>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href={activeSlide.href} className="inline-flex min-h-[66px] items-center justify-center gap-3 rounded-full bg-shine-navy px-9 text-lg font-bold !text-white [&>svg]:!text-white transition hover:-translate-y-1 hover:bg-[#142657]">
              {activeSlide.primary}
              <ArrowRight size={20} />
            </Link>
            <Link href="#about" className="inline-flex min-h-[66px] items-center justify-center rounded-full border-2 border-shine-navy px-8 text-lg font-bold text-shine-navy transition hover:bg-shine-navy hover:text-white">
              {activeSlide.secondary}
            </Link>
          </div>

          <div className="mt-9 flex items-center gap-3" aria-label="เลือกสไลด์">
            {slides.map((slide, index) => (
              <button
                key={slide.eyebrow}
                type="button"
                aria-label={`ไปยังสไลด์ที่ ${index + 1}`}
                aria-current={activeIndex === index ? "true" : undefined}
                onClick={() => goTo(index)}
                className={`h-2.5 rounded-full transition-all ${activeIndex === index ? "w-12 bg-shine-navy" : "w-2.5 bg-slate-300 hover:bg-amber-400"}`}
              />
            ))}
            <span className="ml-2 text-sm font-semibold tabular-nums text-slate-400">0{activeIndex + 1} / 0{slides.length}</span>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-[720px] items-center justify-center py-6 lg:py-0">
          <div className="relative aspect-[1.04/1] w-full overflow-hidden rounded-[48px] border-[10px] border-white bg-shine-navy shadow-[0_30px_65px_rgba(22,39,89,.22)] sm:rounded-[62px] sm:border-[13px]">
            <svg
              viewBox="0 0 620 590"
              className="absolute inset-0 h-full w-full"
              role="img"
              aria-label="ภาพโรงเรียน ShineSchool ใต้ท้องฟ้าสดใส มีพระอาทิตย์และต้นไม้"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
            >
              <defs>
                <linearGradient id="heroSky" x1="310" y1="0" x2="310" y2="590" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#263D80" />
                  <stop offset="1" stopColor="#4265A8" />
                </linearGradient>
                <linearGradient id="heroWall" x1="310" y1="250" x2="310" y2="500" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFDF6" />
                  <stop offset="1" stopColor="#F5EBD5" />
                </linearGradient>
                <linearGradient id="heroRoof" x1="310" y1="165" x2="310" y2="300" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFD95A" />
                  <stop offset="1" stopColor="#F2B936" />
                </linearGradient>
                <filter id="heroSunGlow" x="390" y="30" width="190" height="190" colorInterpolationFilters="sRGB" filterUnits="userSpaceOnUse">
                  <feGaussianBlur stdDeviation="13" />
                </filter>
              </defs>

              <path d="M0 0H620V590H0Z" fill="url(#heroSky)" />

              {/* Soft distant clouds */}
              <g className="hero-cloud hero-cloud-one" fill="#FFF" opacity=".92">
                <path d="M64 174C64 158 77 146 93 146C100 126 120 116 140 123C151 102 183 103 195 126C216 123 232 138 232 157C232 173 219 184 201 184H91C75 184 64 180 64 174Z" />
              </g>
              <g className="hero-cloud hero-cloud-two" fill="#FFF" opacity=".72">
                <path d="M390 244C390 232 400 223 413 223C420 207 437 201 452 207C463 190 489 192 498 211C516 208 530 221 530 237C530 251 519 260 504 260H413C399 260 390 253 390 244Z" />
              </g>

              {/* Smiling sun */}
              <g className="hero-sun">
                <circle cx="484" cy="126" r="69" fill="#FFD95A" opacity=".32" filter="url(#heroSunGlow)" />
                <g stroke="#FFE58A" strokeWidth="8" strokeLinecap="round">
                  <path d="M484 30V12M484 240V222M388 126H370M598 126H580M416 58L403 45M565 207L552 194M552 58L565 45M403 207L416 194" />
                </g>
                <circle cx="484" cy="126" r="52" fill="#FFD95A" stroke="#FFF0A9" strokeWidth="5" />
                <ellipse cx="466" cy="119" rx="4.5" ry="6" fill="#795B20" />
                <ellipse cx="502" cy="119" rx="4.5" ry="6" fill="#795B20" />
                <path d="M468 140C477 151 491 151 500 140" stroke="#795B20" strokeWidth="5" strokeLinecap="round" />
                <circle cx="452" cy="137" r="7" fill="#F69A91" />
                <circle cx="516" cy="137" r="7" fill="#F69A91" />
              </g>

              {/* Floating sparkles */}
              <g className="hero-sparkles" fill="#FFE58A">
                <path d="M302 104L310 125L331 133L310 141L302 162L294 141L273 133L294 125L302 104Z" />
                <path d="M548 292L554 307L569 313L554 319L548 334L542 319L527 313L542 307L548 292Z" />
                <path d="M85 286L90 299L103 304L90 309L85 322L80 309L67 304L80 299L85 286Z" />
              </g>

              {/* Rolling green garden */}
              <path d="M0 438C102 395 179 431 273 420C383 406 480 385 620 433V590H0V438Z" fill="#9BD6A8" />
              <path d="M0 477C124 439 214 472 322 456C441 438 530 448 620 475V590H0V477Z" fill="#75BD91" />

              {/* School building shadow */}
              <ellipse cx="310" cy="494" rx="218" ry="25" fill="#24416C" opacity=".2" />

              {/* Main school building */}
              <path d="M150 284L310 190L470 284V474H150V284Z" fill="url(#heroWall)" stroke="#263D80" strokeWidth="8" strokeLinejoin="round" />
              <path d="M127 288L310 177L493 288L478 310L310 209L142 310L127 288Z" fill="url(#heroRoof)" stroke="#D69D2D" strokeWidth="7" strokeLinejoin="round" />
              <path d="M278 218H342V269H278V218Z" fill="#FFF4C9" stroke="#D69D2D" strokeWidth="5" />
              <path d="M310 218V269M278 243H342" stroke="#D69D2D" strokeWidth="4" />
              <path d="M170 310H450V331H170V310Z" fill="#F4C957" opacity=".8" />

              {/* Round school emblem */}
              <circle cx="310" cy="293" r="24" fill="#FFF8DF" stroke="#D9A53B" strokeWidth="4" />
              <path d="M310 278V307M310 286C301 277 293 282 295 292C301 292 306 290 310 286ZM310 286C319 277 327 282 325 292C319 292 314 290 310 286Z" fill="#78B989" stroke="#4D966E" strokeWidth="2" strokeLinejoin="round" />

              {/* Windows */}
              <g fill="#A9D5F2" stroke="#263D80" strokeWidth="6">
                <rect x="178" y="350" width="68" height="66" rx="12" />
                <rect x="374" y="350" width="68" height="66" rx="12" />
              </g>
              <g stroke="#FFF" strokeWidth="5">
                <path d="M212 352V414M178 383H246M408 352V414M374 383H442" />
              </g>
              <path d="M188 359L202 359L188 373V359ZM384 359L398 359L384 373V359Z" fill="#FFF" opacity=".8" />

              {/* Welcoming entrance */}
              <path d="M270 474V397C270 375 288 358 310 358C332 358 350 375 350 397V474H270Z" fill="#E6B84F" stroke="#263D80" strokeWidth="7" />
              <path d="M282 474V398C282 382 294 370 310 370C326 370 338 382 338 398V474H282Z" fill="#6E8DBB" />
              <path d="M310 371V474" stroke="#FFF0C1" strokeWidth="4" />
              <circle cx="326" cy="427" r="4" fill="#FFE58A" />
              <path d="M252 476H368L381 492H239L252 476Z" fill="#FFF4D5" stroke="#D7A64A" strokeWidth="4" strokeLinejoin="round" />

              {/* Garden trees and flowers */}
              <g className="hero-tree-left">
                <path d="M91 467V408" stroke="#8A5B3C" strokeWidth="12" strokeLinecap="round" />
                <circle cx="91" cy="388" r="34" fill="#65B987" stroke="#3E956C" strokeWidth="5" />
                <circle cx="67" cy="408" r="22" fill="#8DD39A" />
                <circle cx="113" cy="409" r="22" fill="#8DD39A" />
              </g>
              <g className="hero-tree-right">
                <path d="M528 468V410" stroke="#8A5B3C" strokeWidth="12" strokeLinecap="round" />
                <circle cx="528" cy="390" r="34" fill="#65B987" stroke="#3E956C" strokeWidth="5" />
                <circle cx="504" cy="410" r="22" fill="#8DD39A" />
                <circle cx="550" cy="410" r="22" fill="#8DD39A" />
              </g>
              <g fill="#FFF4D5">
                <circle cx="145" cy="490" r="7"/><circle cx="158" cy="484" r="7"/><circle cx="171" cy="490" r="7"/><circle cx="158" cy="497" r="7"/>
                <circle cx="447" cy="493" r="7"/><circle cx="460" cy="487" r="7"/><circle cx="473" cy="493" r="7"/><circle cx="460" cy="500" r="7"/>
              </g>
              <g fill="#F2B94B">
                <circle cx="158" cy="490" r="4"/><circle cx="460" cy="493" r="4"/>
              </g>
            </svg>

            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2 whitespace-nowrap rounded-full bg-white/10 px-4 py-2 text-xs font-semibold text-white/90 backdrop-blur sm:bottom-7 sm:text-sm">
              <Star size={14} fill="currentColor" className="text-shine-yellow" />
              {activeSlide.artText}
            </div>
          </div>

          <div key={activeIndex + "-card"} className="absolute -bottom-1 right-0 flex max-w-[260px] items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-xl sm:bottom-4 sm:-right-3 sm:p-5">
            <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-shine-yellow text-shine-navy">
              <IllustrationIcon size={25} />
            </span>
            <span>
              <strong className="block text-sm text-shine-ink">{activeSlide.artTitle}</strong>
              <small className="mt-1 block text-xs text-slate-500">ShineSchool · Learn & Grow</small>
            </span>
          </div>

          <div className="absolute -left-3 top-8 flex gap-2 sm:-left-7">
            <button type="button" onClick={() => goTo(activeIndex - 1)} aria-label="สไลด์ก่อนหน้า" className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-shine-navy shadow-lg transition hover:bg-shine-yellow">
              <ArrowLeft size={19} />
            </button>
            <button type="button" onClick={() => goTo(activeIndex + 1)} aria-label="สไลด์ถัดไป" className="grid size-11 place-items-center rounded-full border border-slate-200 bg-white text-shine-navy shadow-lg transition hover:bg-shine-yellow">
              <ArrowRight size={19} />
            </button>
          </div>
          <span className="absolute -right-2 top-1/3 text-4xl text-shine-yellow sm:-right-8">✦</span>
        </div>
      </div>
      <style jsx>{`
        @keyframes shine-in {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes hero-sun-float {
          0%, 100% { transform: translateY(0) rotate(-2deg); }
          50% { transform: translateY(-9px) rotate(2deg); }
        }
        @keyframes hero-cloud-drift {
          0%, 100% { transform: translateX(0); }
          50% { transform: translateX(12px); }
        }
        @keyframes hero-tree-sway {
          0%, 100% { transform: rotate(-2deg); }
          50% { transform: rotate(2deg); }
        }
        @keyframes hero-sparkle-twinkle {
          0%, 100% { opacity: .45; transform: scale(.85); }
          50% { opacity: 1; transform: scale(1.12); }
        }
        .hero-sun {
          transform-origin: 484px 126px;
          animation: hero-sun-float 4s ease-in-out infinite;
        }
        .hero-cloud-one { animation: hero-cloud-drift 7s ease-in-out infinite; }
        .hero-cloud-two { animation: hero-cloud-drift 9s ease-in-out infinite reverse; }
        .hero-tree-left, .hero-tree-right {
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: hero-tree-sway 3.8s ease-in-out infinite;
        }
        .hero-tree-right { animation-delay: .6s; }
        .hero-sparkles {
          transform-box: fill-box;
          transform-origin: center;
          animation: hero-sparkle-twinkle 2.2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-sun, .hero-cloud-one, .hero-cloud-two,
          .hero-tree-left, .hero-tree-right, .hero-sparkles {
            animation: none;
          }
        }
      `}</style>
    </section>
  );
}