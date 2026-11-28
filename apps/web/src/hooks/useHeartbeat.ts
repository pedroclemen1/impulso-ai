import { useEffect } from 'react';
import { api } from '@/lib/api';

/**
 * Registra tempo ativo: envia um heartbeat por minuto apenas quando a aba está visível
 * e houve interação recente. Pausas longas são descartadas pelo backend.
 */
export function useHeartbeat(courseId?: string) {
  useEffect(() => {
    let lastInteraction = Date.now();
    const mark = () => {
      lastInteraction = Date.now();
    };
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach((e) => window.addEventListener(e, mark, { passive: true }));
    const send = () => {
      if (document.visibilityState === 'visible' && Date.now() - lastInteraction < 3 * 60_000) {
        api.post('/learning/heartbeat', courseId ? { courseId } : {}).catch(() => undefined);
      }
    };
    send();
    const id = window.setInterval(send, 60_000);
    return () => {
      window.clearInterval(id);
      events.forEach((e) => window.removeEventListener(e, mark));
    };
  }, [courseId]);
}
