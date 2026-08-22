import React, { useEffect, useState } from "react";
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  UserMinus,
  Loader2,
  Inbox,
  Send,
} from "lucide-react";
import { Bet, Friend, FriendRequest, UserSearchResult } from "../types";
import {
  searchUsers,
  listFriends,
  listRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRequest,
  removeFriend,
  fetchFriendBets,
} from "../lib/socialApi";
import MemberProfile from "./MemberProfile";
import { useI18n } from "../lib/i18n";

interface SocialProps {
  currency: string;
  isDark: boolean;
}

export default function Social({ currency, isDark }: SocialProps) {
  const { t } = useI18n();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Procura de utilizadores
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  // Perfil de um amigo (vista read-only)
  const [viewing, setViewing] = useState<Friend | null>(null);
  const [friendBets, setFriendBets] = useState<Bet[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Carregamento de amigos + pedidos
  // ----------------------------------------------------
  const refresh = async () => {
    try {
      setError(null);
      const [f, r] = await Promise.all([listFriends(), listRequests()]);
      setFriends(f);
      setIncoming(r.incoming);
      setOutgoing(r.outgoing);
    } catch (e: any) {
      setError(e?.message || t("social.error.load"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  // Procura com debounce (min. 2 caracteres).
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const handle = setTimeout(async () => {
      try {
        setResults(await searchUsers(q));
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 350);
    return () => clearTimeout(handle);
  }, [query]);

  const flashNotice = (msg: string) => {
    setNotice(msg);
    setTimeout(() => setNotice(null), 3000);
  };

  // Atualiza o estado de um resultado da procura sem refazer o pedido.
  const patchResult = (userId: string, relationship: UserSearchResult["relationship"]) => {
    setResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship } : u)));
  };

  const handleSend = async (u: UserSearchResult) => {
    try {
      const status = await sendFriendRequest(u.username);
      patchResult(u.id, status === "friends" ? "friends" : "outgoing");
      flashNotice(t(status === "friends" ? "social.nowFriends" : "social.requestSent", { username: u.username }));
      refresh();
    } catch (e: any) {
      setError(e?.message || t("social.error.send"));
    }
  };

  const handleAccept = async (r: FriendRequest) => {
    try {
      await acceptFriendRequest(r.id);
      flashNotice(t("social.accepted", { username: r.username }));
      refresh();
    } catch (e: any) {
      setError(e?.message || t("social.error.accept"));
    }
  };

  const handleRemoveRequest = async (r: FriendRequest) => {
    try {
      await removeFriendRequest(r.id);
      refresh();
    } catch (e: any) {
      setError(e?.message || t("social.error.removeRequest"));
    }
  };

  const handleRemoveFriend = async (f: Friend) => {
    try {
      await removeFriend(f.id);
      if (viewing?.id === f.id) setViewing(null);
      refresh();
    } catch (e: any) {
      setError(e?.message || t("social.error.removeFriend"));
    }
  };

  const openFriend = async (f: Friend) => {
    setViewing(f);
    setViewLoading(true);
    setViewError(null);
    setFriendBets([]);
    try {
      const { bets } = await fetchFriendBets(f.id);
      setFriendBets(bets);
    } catch (e: any) {
      setViewError(e?.message || t("social.error.friendBets"));
    } finally {
      setViewLoading(false);
    }
  };

  // ====================================================
  // VISTA: perfil de um amigo
  // ====================================================
  if (viewing) {
    return (
      <MemberProfile
        username={viewing.username}
        subtitle={t("social.friendProfile")}
        bets={friendBets}
        currency={currency}
        isDark={isDark}
        loading={viewLoading}
        error={viewError}
        onBack={() => setViewing(null)}
        action={
          <button
            onClick={() => handleRemoveFriend(viewing)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-sm bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold transition-colors cursor-pointer"
          >
            <UserMinus size={14} /> {t("social.removeFriend")}
          </button>
        }
      />
    );
  }

  // ====================================================
  // VISTA: lista social (amigos + pedidos + procura)
  // ====================================================
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 tracking-tight font-display flex items-center gap-2">
          <Users size={20} className="text-emerald-600 dark:text-emerald-400" /> {t("social.title")}
        </h2>
        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-0.5">
          {t("social.subtitle")}
        </p>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-200 rounded-sm border border-emerald-200 dark:border-emerald-900 text-xs font-medium">
          {notice}
        </div>
      )}
      {error && (
        <div className="p-3 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-200 rounded-sm border border-rose-200 dark:border-rose-900 flex items-center justify-between gap-2 text-xs font-medium">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="p-1 rounded-sm hover:bg-rose-100 dark:hover:bg-rose-900/50 cursor-pointer"><X size={13} /></button>
        </div>
      )}

      {/* Procurar / adicionar amigos */}
      <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800 space-y-3">
        <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
          <UserPlus size={16} className="text-emerald-600 dark:text-emerald-400" /> {t("social.addFriend")}
        </h4>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
placeholder={t("social.searchPlaceholder")}
            className="w-full pl-9 pr-3 py-2 rounded-sm border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 focus:bg-white dark:focus:bg-zinc-800 focus:outline-none focus:border-emerald-500 text-sm text-zinc-700 dark:text-zinc-200"
          />
        </div>

        {query.trim().length >= 2 && (
          <div className="space-y-1.5">
            {searching && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 flex items-center gap-1.5 px-1"><Loader2 size={12} className="animate-spin" /> {t("social.searching")}</p>
            )}
            {!searching && results.length === 0 && (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 px-1">{t("social.noUsers")}</p>
            )}
            {results.map((u) => (
              <div key={u.id} className="flex items-center justify-between gap-2 p-2 rounded-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-200 flex items-center justify-center font-bold text-[10px] uppercase shrink-0">
                    {u.username.slice(0, 2)}
                  </div>
                  <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{u.username}</span>
                </div>
                {u.relationship === "friends" ? (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2">{t("social.friends")}</span>
                ) : u.relationship === "outgoing" ? (
                  <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider px-2 flex items-center gap-1"><Clock size={11} /> {t("social.pending")}</span>
                ) : u.relationship === "incoming" ? (
                  <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider px-2">{t("social.askedYou")}</span>
                ) : (
                  <button
                    onClick={() => handleSend(u)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
                  >
                    <UserPlus size={13} /> {t("social.add")}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12 text-zinc-400 dark:text-zinc-500 text-xs gap-2">
          <Loader2 size={16} className="animate-spin" /> {t("common.loading")}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pedidos recebidos */}
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2 mb-3">
              <Inbox size={16} className="text-emerald-600 dark:text-emerald-400" /> {t("social.incoming")}
              {incoming.length > 0 && <span className="text-[10px] font-bold bg-emerald-600 text-white rounded-full px-1.5 py-0.5">{incoming.length}</span>}
            </h4>
            {incoming.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2">{t("social.noPending")}</p>
            ) : (
              <div className="space-y-2">
                {incoming.map((r) => (
                  <div key={r.id} className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{r.username}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button onClick={() => handleAccept(r)} title={t("social.accept")} className="p-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors cursor-pointer"><Check size={14} /></button>
                      <button onClick={() => handleRemoveRequest(r)} title={t("social.decline")} className="p-1.5 rounded-sm bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"><X size={14} /></button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {outgoing.length > 0 && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                <h5 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest flex items-center gap-1.5 mb-2"><Send size={11} /> {t("social.sent")}</h5>
                <div className="space-y-2">
                  {outgoing.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1.5"><Clock size={11} /> {r.username}</span>
                      <button onClick={() => handleRemoveRequest(r)} className="text-[10px] font-semibold text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 uppercase tracking-wider transition-colors cursor-pointer">{t("common.cancel")}</button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Amigos */}
          <div className="bg-white dark:bg-zinc-900 rounded-sm p-5 border border-zinc-200 dark:border-zinc-800">
            <h4 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2 mb-3">
              <Users size={16} className="text-emerald-600 dark:text-emerald-400" /> {t("social.friends")}
              {friends.length > 0 && <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500">({friends.length})</span>}
            </h4>
            {friends.length === 0 ? (
              <p className="text-xs text-zinc-400 dark:text-zinc-500 py-2">{t("social.noFriends")}</p>
            ) : (
              <div className="space-y-1.5">
                {friends.map((f) => (
                  <div key={f.id} className="flex items-center justify-between gap-2 p-2 rounded-sm hover:bg-zinc-50 dark:hover:bg-zinc-800/60 group">
                    <button onClick={() => openFriend(f)} className="flex items-center gap-2.5 min-w-0 flex-1 text-left cursor-pointer">
                      <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[11px] uppercase shrink-0">
                        {f.username.slice(0, 2)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">{f.username}</p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500">{t("social.viewStats")}</p>
                      </div>
                    </button>
                    <button
                      onClick={() => handleRemoveFriend(f)}
title={t("social.removeFriend")}
                      className="p-1.5 rounded-sm text-zinc-300 dark:text-zinc-600 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                    >
                      <UserMinus size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
