// src/hooks/useAdminPanel.ts
// Estado e ações do painel de gestão, partilhados pela versão desktop e pela
// mobile: as duas mostram exatamente os mesmos números e fazem exatamente as
// mesmas alterações, só com layouts diferentes.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  deleteUser,
  fetchAuditLog,
  fetchOverview,
  fetchUsers,
  grantSubscription,
  revokeSubscription,
  setUserRole,
  setUserTrial,
  type AdminAuditEntry,
  type AdminOverview,
  type AdminUser,
  type AdminUserFilter,
} from "../lib/adminApi";

const PAGE_SIZE = 20;
const SEARCH_DEBOUNCE_MS = 300;

/**
 * @param onAccessChanged Chamado depois de qualquer alteração a uma conta.
 *   Serve para o resto da app reler a própria subscrição: um administrador
 *   que se tire a si o período experimental tem de ver os separadores pagos
 *   fecharem-se logo, e não só no próximo arranque.
 */
export function useAdminPanel(onAccessChanged?: () => void) {
  const [overview, setOverview] = useState<AdminOverview | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<AdminUserFilter>("all");
  const [search, setSearch] = useState("");
  const [audit, setAudit] = useState<AdminAuditEntry[]>([]);

  const [loading, setLoading] = useState(true);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // O texto de pesquisa só chega ao servidor depois de o utilizador parar de
  // escrever — senão era um pedido por tecla.
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  // Uma pesquisa ou filtro novo recomeça na primeira página: ficar na página 7
  // de uma lista que agora tem 2 resultados só mostrava o vazio.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filter]);

  const aliveRef = useRef(true);
  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  // Guardado numa ref para o runAction não ser recriado (e a lista não voltar
  // a carregar) só porque o pai passou uma função nova neste render.
  const onAccessChangedRef = useRef(onAccessChanged);
  useEffect(() => {
    onAccessChangedRef.current = onAccessChanged;
  }, [onAccessChanged]);

  const loadUsers = useCallback(async () => {
    const result = await fetchUsers({ search: debouncedSearch, filter, page, pageSize: PAGE_SIZE });
    if (!aliveRef.current) return;
    setUsers(result.users);
    setTotal(result.total);
  }, [debouncedSearch, filter, page]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewData, auditData] = await Promise.all([fetchOverview(), fetchAuditLog()]);
      if (!aliveRef.current) return;
      setOverview(overviewData);
      setAudit(auditData.entries);
      await loadUsers();
    } catch (err) {
      if (aliveRef.current) setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (aliveRef.current) setLoading(false);
    }
  }, [loadUsers]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  /**
   * Executa uma alteração numa conta e recarrega tudo a seguir.
   *
   * Recarregar em vez de remendar a linha em memória é de propósito: mudar um
   * papel ou conceder uma subscrição também mexe nos totais do topo, e um
   * painel de gestão que mostra números desatualizados não serve de nada.
   */
  const runAction = useCallback(
    async (userId: string, action: () => Promise<unknown>): Promise<boolean> => {
      setBusyUserId(userId);
      setError(null);
      try {
        await action();
        await loadAll();
        onAccessChangedRef.current?.();
        return true;
      } catch (err) {
        if (aliveRef.current) setError(err instanceof Error ? err.message : String(err));
        return false;
      } finally {
        if (aliveRef.current) setBusyUserId(null);
      }
    },
    [loadAll],
  );

  return {
    overview,
    users,
    total,
    page,
    pageSize: PAGE_SIZE,
    setPage,
    filter,
    setFilter,
    search,
    setSearch,
    audit,
    loading,
    busyUserId,
    error,
    clearError: () => setError(null),
    reload: loadAll,

    promote: (user: AdminUser) => runAction(user.id, () => setUserRole(user.id, "admin")),
    demote: (user: AdminUser) => runAction(user.id, () => setUserRole(user.id, "user")),
    grant: (user: AdminUser, months: number, note?: string) =>
      runAction(user.id, () => grantSubscription(user.id, months, note)),
    revoke: (user: AdminUser) => runAction(user.id, () => revokeSubscription(user.id)),
    setTrial: (user: AdminUser, days: number) => runAction(user.id, () => setUserTrial(user.id, days)),
    remove: (user: AdminUser) => runAction(user.id, () => deleteUser(user.id)),
  };
}
