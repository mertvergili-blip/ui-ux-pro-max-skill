"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const DISMISSED_KEY = "maison-install-prompt-dismissed";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

// Chrome/Android can be installed programmatically via beforeinstallprompt;
// iOS Safari has no such API, so it only ever gets the manual instructions.
export function InstallPrompt() {
  const [visible, setVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as { standalone?: boolean }).standalone === true;
    if (standalone) return;
    if (sessionStorage.getItem(DISMISSED_KEY)) return;

    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsIOS(ios);

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstall);

    // iOS never fires beforeinstallprompt — show the manual-steps card
    // after a short delay so it doesn't compete with the entrance sequence.
    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (ios) {
      iosTimer = setTimeout(() => setVisible(true), 4000);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const dismiss = () => {
    setVisible(false);
    sessionStorage.setItem(DISMISSED_KEY, "1");
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    dismiss();
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
          className="fixed bottom-[calc(var(--bottom-nav-h,0px)+1.25rem)] left-[max(1.25rem,env(safe-area-inset-left))] right-[max(1.25rem,env(safe-area-inset-right))] z-50 sm:left-auto sm:right-[max(1.25rem,env(safe-area-inset-right))] sm:w-[340px] lg:bottom-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]"
        >
          {/* .bento-tile sets position:relative, which would otherwise
              cascade-override the .fixed positioning above if applied to
              the same element — kept on this inner wrapper instead. */}
          <div className="bento-tile bento-gold px-5 py-4">
            <div className="bento-orb" style={{ width: 100, height: 100, top: -30, right: -25 }} />
            <div className="relative flex items-start justify-between gap-3">
              <div>
                <p className="mb-1 text-[9.5px] uppercase tracking-[2px] text-[#e4c98f]">
                  Ana Ekrana Ekle
                </p>
                {isIOS ? (
                  <p className="text-[12.5px] leading-relaxed text-bone-dim">
                    Paylaş <span aria-hidden>⎋</span> simgesine dokun, sonra{" "}
                    <span className="text-bone">&quot;Ana Ekrana Ekle&quot;</span>
                    &apos;yi seç — Maison gerçek bir uygulama gibi açılsın.
                  </p>
                ) : (
                  <p className="text-[12.5px] leading-relaxed text-bone-dim">
                    Maison&apos;u telefonuna yükle, gerçek bir uygulama gibi
                    tam ekran aç.
                  </p>
                )}
              </div>
              <button
                onClick={dismiss}
                aria-label="Kapat"
                className="mt-0.5 flex-shrink-0 text-[13px] text-white/40 transition-colors hover:text-white/80"
              >
                ✕
              </button>
            </div>
            {!isIOS && (
              <button
                onClick={install}
                className="relative mt-3 text-[10.5px] uppercase tracking-[1.5px] text-[#e4c98f] transition-colors hover:text-bone"
              >
                Yükle →
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
