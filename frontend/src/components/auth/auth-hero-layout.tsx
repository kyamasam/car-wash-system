import Image from "next/image";
import Link from "next/link";

interface AuthHeroLayoutProps {
  children: React.ReactNode;
  heading: string;
  subheading: string;
  imageSrc: string;
}

function Logo({ white = false }: { white?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2 w-fit">
      <div className="relative w-7 h-7 shrink-0">
        <div
          className={`absolute inset-0 border-2 rotate-45 rounded-sm ${white ? "border-white" : "border-primary"
            }`}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className={`w-1.5 h-1.5 rounded-sm rotate-45 ${white ? "bg-white" : "bg-primary"
              }`}
          />
        </div>
      </div>
      <div className="flex flex-col leading-none">
        <span
          className={`text-[15px] font-black tracking-tight uppercase ${white ? "text-white" : "text-primary/80"
            }`}
        >
          SF
        </span>
        <span
          className={`text-[8px] font-light tracking-[0.3em] uppercase ${white ? "text-white/70" : "text-primary"
            }`}
        >
          Networks
        </span>
      </div>
    </Link>
  );
}

export function AuthHeroLayout({
  children,
  heading,
  subheading,
  imageSrc,
}: AuthHeroLayoutProps) {
  return (
    <div className="h-screen overflow-hidden flex">
      {/* Left Hero Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative shrink-0">
        <Image src={imageSrc} alt="" fill className="object-cover" priority />
        <div className="absolute inset-0 bg-black/55" />
        <div className="relative z-10 flex flex-col justify-between p-10 w-full">
          <Logo white />
          <div className="text-white">
            <h2 className="text-4xl font-bold mb-3 leading-tight">{heading}</h2>
            <p className="text-white/75 text-base leading-relaxed">{subheading}</p>
          </div>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50">
        {/* Top bar */}


        <div className="flex-1 flex items-center justify-center px-8 pb-10">
          {children}
        </div>
      </div>
    </div>
  );
}
