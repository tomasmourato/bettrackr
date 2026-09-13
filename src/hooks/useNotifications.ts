// src/hooks/useNotifications.ts
// As notificações de quem está a ver, para a página na Gestão (e o contador do
// sino) e para o aviso no topo do painel do bot. Relê quando chega um push com a
// app aberta.

import { useCallback, useEffect, useRef, useState } from "react";
import { fetchNotifications, markNotificationsRead, type NotificationsPage } from "../lib/notificationsApi";
import { PUSH_RECEIVED_EVENT } from "../lib/push";
import { messageOf } from "../lib/apiError";
import { useI18n } from "../lib/i18n";

export function useNotifications() {
  const [page, setPage] = useState<NotificationsPage | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // O `t` muda com o idioma, e isso não é motivo para voltar a pedir a lista.
  const { t } = useI18n();
  const tRef = useRef(t);
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchNotifications();
      if (!aliveRef.current) return;
      setPage(data);
      setError(null);
    } catch (err) {
      if (aliveRef.current) setError(messageOf(err, tRef.current, "notif.loadError"));
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    const onPush = () => void reload();
    window.addEventListener(PUSH_RECEIVED_EVENT, onPush);
    return () => window.removeEventListener(PUSH_RECEIVED_EVENT, onPush);
  }, [reload]);

  const markAllRead = useCallback(async () => {
    try {
      await markNotificationsRead();
    } catch {
      // Ficam por ler; volta a tentar-se da próxima vez que a página abrir.
      return;
    }
    if (!aliveRef.current) return;
    const now = new Date().toISOString();
    setPage(
      (current) =>
        current && {
          ...current,
          unread: 0,
          notifications: current.notifications.map((item) => (item.readAt ? item : { ...item, readAt: now })),
        },
    );
  }, []);

  return {
    items: page?.notifications ?? [],
    unread: page?.unread ?? 0,
    pushConfigured: page?.pushConfigured ?? false,
    devices: page?.devices ?? 0,
    /** Já houve uma resposta do servidor (a lista pode estar vazia). */
    loaded: page !== null,
    loading,
    error,
    reload,
    markAllRead,
  };
}

export type NotificationsState = ReturnType<typeof useNotifications>;
