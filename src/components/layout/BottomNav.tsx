"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { transitions } from "@/lib/animations";

const navItems = [
  { href: "/", label: "ホーム", icon: HomeIcon },
  { href: "/upload", label: "投稿", icon: PlusIcon },
  { href: "/monthly", label: "月の記録", icon: CalendarIcon },
  { href: "/growth", label: "成長記録", icon: ChartIcon },
  { href: "/settings", label: "設定", icon: SettingsIcon },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <motion.nav
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...transitions.spring, delay: 0.1 }}
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
    >
      <div className="mx-4 mb-3 rounded-3xl shadow-large border border-white/30 overflow-hidden"
        style={{
          background: "linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(255, 255, 255, 0.5) inset",
        }}
      >
        <div className="flex items-center justify-around h-[68px]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative flex flex-col items-center justify-center w-full h-full"
              >
                <motion.div
                  className="flex flex-col items-center relative"
                  whileTap={{ scale: 0.85 }}
                  transition={transitions.spring}
                >
                  {/* Active background pill */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-bg"
                      className="absolute -inset-x-2 -inset-y-1 bg-gradient-to-br from-mare-100 to-mare-50 rounded-2xl"
                      transition={transitions.springBouncy}
                    />
                  )}

                  {/* Active indicator dot */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute -top-2.5 w-1.5 h-1.5 bg-gradient-to-r from-mare-400 to-mare-500 rounded-full shadow-glow"
                      transition={transitions.springBouncy}
                    />
                  )}

                  <motion.div
                    animate={{
                      scale: isActive ? 1.15 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={transitions.spring}
                    className="relative z-10"
                  >
                    <Icon
                      className={`w-6 h-6 transition-colors duration-200 ${
                        isActive ? "text-mare-500" : "text-gray-400"
                      }`}
                    />
                  </motion.div>

                  <motion.span
                    animate={{
                      opacity: isActive ? 1 : 0.5,
                      scale: isActive ? 1 : 0.9,
                    }}
                    transition={transitions.snappy}
                    className={`relative z-10 text-[11px] mt-1.5 font-semibold tracking-tight ${
                      isActive ? "text-mare-500" : "text-gray-400"
                    }`}
                  >
                    {item.label}
                  </motion.span>
                </motion.div>
              </Link>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );
}

function ChartIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );
}

function SettingsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function CalendarIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}
