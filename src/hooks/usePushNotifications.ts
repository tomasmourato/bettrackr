// src/hooks/usePushNotifications.ts
// Liga o push da app Android enquanto `enabled` - há sessão E a pessoa tem o bot
// (ver src/lib/push.ts). Vive no App.tsx junto dos outros hooks, ANTES do gate
// de login: por isso recebe `enabled` em vez de só existir quando há sessão.

import { useEffect, useRef } from "react";
import { startPush } from "../lib/push";

export function usePushNotifications(
  enabled: boolean,
  channel: { name: string; description: string },
  onOpen: (data: Record<string, string>) => void,
): void {
  // Numa ref, para o registo não se repetir só porque o pai passou uma função nova.
  const onOpenRef = useRef(onOpen);
  useEffect(() => {
    onOpenRef.current = onOpen;
  }, [onOpen]);

  const { name, description } = channel;
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    let stop: (() => void) | undefined;

    void startPush({
      channelName: name,
      channelDescription: description,
      onOpen: (data) => onOpenRef.current(data),
    }).then((stopListening) => {
      if (cancelled) stopListening();
      else stop = stopListening;
    });

    return () => {
      cancelled = true;
      stop?.();
    };
  }, [enabled, name, description]);
}
