import { BookOpen, Heart } from "lucide-react";
import styles from "./home-sections.module.css";

const values = [
  { title: "เรียนรู้อย่างมีความสุข", description: "สร้างบรรยากาศที่อบอุ่น ให้เด็กกล้าคิด กล้าถาม และสนุกกับการเรียนรู้" },
  { title: "เติบโตตามศักยภาพ", description: "ใส่ใจความแตกต่างของผู้เรียน และส่งเสริมทักษะที่นำไปใช้ได้จริง" },
  { title: "เติบโตไปด้วยกัน", description: "ร่วมมือกับผู้ปกครอง เพื่อสนับสนุนพัฒนาการของเด็กในทุกก้าว" },
];

export function HomeSections() {
  return (
    <>
      <section id="about" className="relative isolate mx-auto grid max-w-[1600px] gap-8 overflow-hidden border-y border-slate-100 px-5 py-16 sm:px-8 lg:grid-cols-[.95fr_1fr_1.05fr] lg:items-center lg:gap-12 lg:px-16 lg:py-24">
        <div className="relative z-10">
          <span className="text-xs font-extrabold tracking-[.2em] text-amber-600">ABOUT SHINESCHOOL</span>
          <h2 className="mt-4 text-3xl font-extrabold leading-snug tracking-tight text-shine-ink sm:text-4xl lg:text-5xl">เราเชื่อว่าเด็กทุกคน<br />มีแสงสว่างในแบบของตัวเอง</h2>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-700">
            <Heart className="size-4 fill-amber-400 text-amber-400" />
            เรียนรู้อย่างมีความสุข เติบโตอย่างมั่นใจ
          </span>
        </div>

        <p className="relative z-10 text-base leading-[2] text-slate-600 sm:text-lg">ShineSchool มุ่งสร้างประสบการณ์การเรียนรู้ที่มีความหมาย เปิดโอกาสให้ผู้เรียนได้พัฒนาความรู้ ทักษะ และความมั่นใจ พร้อมเติบโตไปกับครอบครัวและชุมชนแห่งการเรียนรู้</p>

        <div className={`relative mx-auto w-full max-w-[440px] py-5 ${styles.illustration}`} role="img" aria-label="ภาพประกอบหนังสือแห่งการเรียนรู้ ต้นกล้า และดวงอาทิตย์ยิ้ม">
          <div className="absolute inset-x-[12%] bottom-[8%] top-[12%] rounded-full bg-amber-50" />
          <svg viewBox="0 0 440 330" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10 w-full overflow-visible">
            <g className={styles.float}>
              <path d="M65 104C65 91 76 80 90 80C97 58 119 45 141 52C156 25 194 31 204 59C228 54 247 71 247 93C247 110 233 122 215 122H91C76 122 65 114 65 104Z" fill="white" stroke="#DCE8F5" strokeWidth="4"/>
              <circle cx="132" cy="84" r="3.5" fill="#253B78"/>
              <circle cx="157" cy="84" r="3.5" fill="#253B78"/>
              <path d="M139 96C144 102 151 102 156 96" stroke="#F29B75" strokeWidth="3.5" strokeLinecap="round"/>
            </g>
            <g className={styles.sun}>
              <circle cx="347" cy="73" r="35" fill="#FFD95A"/>
              <path d="M334 72C334 69 336 67 339 67M355 67C358 67 360 69 360 72" stroke="#795B20" strokeWidth="3.5" strokeLinecap="round"/>
              <path d="M338 84C344 91 352 91 358 84" stroke="#795B20" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="328" cy="80" r="4" fill="#F59A91"/>
              <circle cx="368" cy="80" r="4" fill="#F59A91"/>
            </g>
            <path d="M78 164L105 145L129 159L151 139" stroke="#F2B84B" strokeWidth="4" strokeLinecap="round" strokeDasharray="2 10"/>
            <path d="M360 145L373 132L386 145" stroke="#F2B84B" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"/>
            <g className={styles.book}>
              <path d="M75 194C115 176 157 183 218 211V287C158 260 115 253 75 271V194Z" fill="#FFFDF7" stroke="#253B78" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M361 194C321 176 279 183 218 211V287C278 260 321 253 361 271V194Z" fill="#FFFDF7" stroke="#253B78" strokeWidth="5" strokeLinejoin="round"/>
              <path d="M218 211V287" stroke="#253B78" strokeWidth="4"/>
              <path d="M101 214C133 204 163 211 190 224M101 235C133 225 163 232 190 245M336 214C304 204 274 211 247 224M336 235C304 225 274 232 247 245" stroke="#A9C8EE" strokeWidth="5" strokeLinecap="round"/>
              <path d="M185 181L218 197L251 181L241 210L218 220L195 210L185 181Z" fill="#F5C64C" stroke="#D99A26" strokeWidth="3" strokeLinejoin="round"/>
            </g>
            <g className={styles.sprout}>
              <path d="M218 181C218 153 218 137 218 123" stroke="#4B9B71" strokeWidth="6" strokeLinecap="round"/>
              <path d="M218 151C192 151 180 137 183 119C204 119 218 131 218 151Z" fill="#7BCB91" stroke="#4B9B71" strokeWidth="3"/>
              <path d="M218 139C218 118 232 104 254 106C254 126 240 139 218 139Z" fill="#A6DDA4" stroke="#4B9B71" strokeWidth="3"/>
              <path d="M207 164C197 155 191 154 183 158" stroke="#4B9B71" strokeWidth="3" strokeLinecap="round"/>
            </g>
            <g className={styles.sparkle} fill="#F3BE3F">
              <path d="M54 164L59 177L72 182L59 187L54 200L49 187L36 182L49 177L54 164Z"/>
              <path d="M390 205L394 215L404 219L394 223L390 233L386 223L376 219L386 215L390 205Z"/>
            </g>
            <path d="M54 293C118 310 321 310 386 293" stroke="#B7D9C1" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <span className="absolute bottom-0 left-1/2 z-20 -translate-x-1/2 whitespace-nowrap rounded-full border border-white bg-white/95 px-4 py-2 text-xs font-bold text-shine-navy shadow-lg sm:text-sm">ทุกวันคือวันแห่งการค้นพบ ✨</span>
        </div>
      </section>

      <section id="levels" className="relative mx-auto max-w-[1600px] overflow-hidden px-5 py-16 sm:px-8 lg:px-16 lg:py-24">
        <div className="pointer-events-none absolute -left-24 top-20 size-64 rounded-full bg-amber-50 blur-3xl" />
        <div className="pointer-events-none absolute -right-24 bottom-8 size-72 rounded-full bg-sky-50 blur-3xl" />
        <div className="relative text-center">
          <span className="text-xs font-extrabold tracking-[.2em] text-amber-600">OUR LEARNING GROUPS</span>
          <h2 className="mt-3 text-3xl font-extrabold text-shine-ink sm:text-4xl">ระดับชั้นเรียน</h2>
          <p className="mt-4 text-sm text-slate-500 sm:text-base">เลือกกลุ่มการเรียนรู้ที่เหมาะสมกับช่วงวัยและพัฒนาการของผู้เรียน</p>
        </div>

        <div className="relative mt-12 grid gap-7 lg:grid-cols-2">
          <article className="group relative overflow-hidden rounded-[32px] border border-amber-100 bg-gradient-to-br from-[#FFF9E8] via-white to-[#FFF1D2] p-7 shadow-[0_18px_50px_rgba(184,133,45,.10)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(184,133,45,.16)] sm:p-9">
            <div className="absolute -right-8 -top-10 size-48 rounded-full bg-amber-200/30 blur-2xl transition duration-500 group-hover:scale-125" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-amber-100 px-4 py-2 text-xs font-extrabold tracking-wide text-amber-800">กลุ่มที่ 01</span>
                <h3 className="mt-5 text-3xl font-black text-shine-ink sm:text-4xl">เด็กเล็ก</h3>
                <p className="mt-2 text-lg font-semibold text-amber-700">อายุ 7–10 ปี</p>
              </div>
              <div className="grid size-20 shrink-0 place-items-center rounded-[26px] bg-white text-amber-500 shadow-md transition duration-500 group-hover:-rotate-6 group-hover:scale-110 sm:size-24">
                <svg viewBox="0 0 120 120" className="size-16 sm:size-[72px]" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <rect x="9" y="13" width="43" height="48" rx="10" fill="#FFE08A" stroke="#D99B2E" strokeWidth="3"/>
                  <rect x="68" y="13" width="43" height="48" rx="10" fill="#BDE8C8" stroke="#5B9D70" strokeWidth="3"/>
                  <text x="30.5" y="48" textAnchor="middle" fill="#9A6421" fontSize="29" fontWeight="800">A</text>
                  <text x="89.5" y="48" textAnchor="middle" fill="#398458" fontSize="29" fontWeight="800">B</text>
                  <rect x="38" y="69" width="44" height="42" rx="9" fill="#FFFDF7" stroke="#D99B2E" strokeWidth="3"/>
                  <text x="60" y="99" textAnchor="middle" fill="#D58A27" fontSize="27" fontWeight="800">C</text>
                  <path d="M14 78C18 73 18 68 14 63M22 82C29 73 29 65 22 57" stroke="#E8AE3E" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M98 78C102 73 102 68 98 63M106 82C113 73 113 65 106 57" stroke="#65B783" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M56 7L60 1L64 7" stroke="#E8AE3E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="relative mt-8 rounded-2xl border border-amber-100/80 bg-white/85 p-5">
              <span className="text-xs font-bold tracking-[.16em] text-amber-600">SUBJECT</span>
              <p className="mt-2 text-2xl font-extrabold text-shine-navy">Phonics</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">เรียนรู้เสียงและการออกเสียงภาษาอังกฤษ วางพื้นฐานการอ่านและการสะกดคำอย่างสนุกสนาน</p>
            </div>
            <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-amber-800">
              <span className="grid size-7 place-items-center rounded-full bg-amber-100">✓</span>
              เรียนรู้ผ่านเสียงและกิจกรรมที่เหมาะกับวัย
            </div>
          </article>

          <article className="group relative overflow-hidden rounded-[32px] border border-sky-100 bg-gradient-to-br from-[#EAF5FF] via-white to-[#E8F8F5] p-7 shadow-[0_18px_50px_rgba(48,112,161,.10)] transition duration-300 hover:-translate-y-2 hover:shadow-[0_24px_60px_rgba(48,112,161,.16)] sm:p-9">
            <div className="absolute -right-8 -top-10 size-48 rounded-full bg-sky-200/40 blur-2xl transition duration-500 group-hover:scale-125" />
            <div className="relative flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex rounded-full bg-sky-100 px-4 py-2 text-xs font-extrabold tracking-wide text-sky-800">กลุ่มที่ 02</span>
                <h3 className="mt-5 text-3xl font-black text-shine-ink sm:text-4xl">เด็กโต</h3>
                <p className="mt-2 text-lg font-semibold text-sky-700">อายุ 11–15 ปี</p>
              </div>
              <div className="grid size-20 shrink-0 place-items-center rounded-[26px] bg-white text-sky-600 shadow-md transition duration-500 group-hover:rotate-6 group-hover:scale-110 sm:size-24">
                <svg viewBox="0 0 120 120" className="size-16 sm:size-[72px]" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M8 16C8 10 13 6 19 6H82C88 6 93 10 93 16V51C93 57 88 61 82 61H39L22 75V61H19C13 61 8 57 8 51V16Z" fill="#DCEEFF" stroke="#4B83B8" strokeWidth="3" strokeLinejoin="round"/>
                  <text x="50" y="29" textAnchor="middle" fill="#285D91" fontSize="10" fontWeight="800" letterSpacing=".5">HELLO!</text>
                  <path d="M23 39H77M23 48H62" stroke="#83B4E0" strokeWidth="3" strokeLinecap="round"/>
                  <path d="M40 65H99C105 65 110 70 110 76V99C110 105 105 110 99 110H84L70 119V110H51C45 110 40 105 40 99V76C40 70 45 65 51 65Z" fill="#FFFFFF" stroke="#3D76B0" strokeWidth="3" strokeLinejoin="round"/>
                  <text x="75" y="86" textAnchor="middle" fill="#285D91" fontSize="8.5" fontWeight="800">HOW ARE</text>
                  <text x="75" y="97" textAnchor="middle" fill="#285D91" fontSize="8.5" fontWeight="800">YOU?</text>
                  <path d="M99 18C104 23 104 29 99 34M106 12C115 22 115 31 106 41" stroke="#68B8C0" strokeWidth="3" strokeLinecap="round"/>
                  <circle cx="15" cy="94" r="4" fill="#F0B84A"/>
                </svg>
              </div>
            </div>
            <div className="relative mt-8 rounded-2xl border border-sky-100/80 bg-white/85 p-5">
              <span className="text-xs font-bold tracking-[.16em] text-sky-600">SUBJECT</span>
              <p className="mt-2 text-2xl font-extrabold text-shine-navy">ภาษาอังกฤษเพื่อการสื่อสาร</p>
              <p className="mt-2 text-sm leading-7 text-slate-600">ฝึกฟัง พูด และโต้ตอบภาษาอังกฤษในสถานการณ์จริง เพื่อสื่อสารได้อย่างมั่นใจในชีวิตประจำวัน</p>
            </div>
            <div className="relative mt-6 flex items-center gap-2 text-sm font-bold text-sky-800">
              <span className="grid size-7 place-items-center rounded-full bg-sky-100">✓</span>
              พัฒนาทักษะการสื่อสารและความมั่นใจ
            </div>
          </article>
        </div>
      </section>

      <section id="news" className="bg-[#fff9e8] px-5 py-16 sm:px-8 lg:px-16 lg:py-20">
        <div className="mx-auto flex max-w-[1450px] flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <span className="text-xs font-extrabold tracking-[.2em] text-amber-700">NEWS & ACTIVITIES</span>
            <h2 className="mt-3 text-3xl font-extrabold text-shine-ink sm:text-4xl">ทุกวันคือโอกาสในการเติบโต</h2>
            <p className="mt-3 max-w-2xl leading-8 text-slate-600">ติดตามกิจกรรม ข่าวสาร และช่วงเวลาพิเศษของครอบครัว ShineSchool</p>
          </div>
          <BookOpen className="hidden size-24 text-amber-300 md:block" strokeWidth={1.2} />
        </div>
      </section>

      <section id="contact" className="mx-auto my-16 flex max-w-[1450px] flex-col items-start justify-between gap-8 rounded-[32px] bg-shine-navy px-7 py-10 text-white sm:mx-8 sm:px-12 lg:mx-auto lg:my-24 lg:flex-row lg:items-center lg:px-16 lg:py-14">
        <div>
          <span className="text-xs font-bold tracking-[.2em] text-shine-yellow">START YOUR JOURNEY</span>
          <h2 className="mt-4 text-3xl font-extrabold leading-snug sm:text-4xl">พร้อมเริ่มต้นเส้นทาง<br />การเรียนรู้แล้วหรือยัง?</h2>
          <p className="mt-4 text-sm leading-7 text-blue-100 sm:text-base">พูดคุยกับทีมงาน ShineSchool เพื่อค้นหาแนวทางการเรียนรู้ที่เหมาะสม</p>
        </div>
        <a href="mailto:hello@shineschool.example?subject=สอบถามการสมัครเรียน%20ShineSchool" className="inline-flex min-h-14 items-center justify-center rounded-full bg-shine-yellow px-8 font-bold !text-shine-navy transition hover:-translate-y-1 hover:bg-white">สอบถามและสมัครเรียน</a>
      </section>
    </>
  );
}