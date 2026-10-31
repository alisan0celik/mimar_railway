import { Component, useEffect, type ReactNode } from "react";

import { useAuthStore } from "../../store/authStore";
import { endGuideSession, startGuideSession } from "./guide-store";
import { TourOverlay } from "./TourOverlay";
import { WelcomeModal } from "./WelcomeModal";

/** Tanıtım katmanındaki bir hata uygulamayı düşürmesin; katman sessizce kapanır. */
class GuideErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    console.warn("[guide] tour layer disabled after error", error);
    endGuideSession();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/**
 * Tanıtım durumunu oturumdaki kullanıcıya bağlar ve etkin turu çizer.
 * Kullanıcı değişince (çıkış/başka hesap) önceki kullanıcının durumu bırakılır.
 */
export function GuideProvider() {
  const userId = useAuthStore((s) => s.user?.id ?? null);

  useEffect(() => {
    if (userId) void startGuideSession(userId);
    else endGuideSession();
  }, [userId]);

  return (
    <GuideErrorBoundary>
      <WelcomeModal />
      <TourOverlay />
    </GuideErrorBoundary>
  );
}
