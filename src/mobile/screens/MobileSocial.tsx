// src/mobile/screens/MobileSocial.tsx
// Social mobile: procura de utilizadores, pedidos de amizade e lista de
// amigos em listas touch-first; o perfil de um amigo abre em página-folha
// com o dashboard mobile (read-only) + apostas recentes em cards. Reutiliza
// integralmente src/lib/socialApi (mesma semântica do Social desktop).

import { useEffect, useState } from "react";
import { Search, Check, X, UserPlus, UserMinus, Clock, Loader2 } from "lucide-react";
import { Bet, Friend, FriendRequest, UserSearchResult } from "../../types";
import {
  searchUsers,
  listFriends,
  listRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriendRequest,
  removeFriend,
  fetchFriendBets,
} from "../../lib/socialApi";
import { SectionHeader, ListGroup, ListItem, MobileCard, SheetPage, BottomSheet, Pressable, useToast } from "../ui";
import { useI18n } from "../../lib/i18n";

import MobileMemberProfile from "../components/MobileMemberProfile";

interface MobileSocialProps {
  currency: string;
  isDark: boolean;
}

function Avatar({ username, size = "w-9 h-9 text-sm" }: { username: string; size?: string }) {
  return (
    <span className={`${size} rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold uppercase shrink-0`}>
      {username.slice(0, 2)}
    </span>
  );
}

export default function MobileSocial({ currency, isDark }: MobileSocialProps) {
  const { t, formatDate } = useI18n();
  const toast = useToast();

  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [outgoing, setOutgoing] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const [viewing, setViewing] = useState<Friend | null>(null);
  const [friendBets, setFriendBets] = useState<Bet[]>([]);
  const [viewLoading, setViewLoading] = useState(false);
  const [removingFriend, setRemovingFriend] = useState<Friend | null>(null);

  const refresh = async () => {
    try {
      const [f, r] = await Promise.all([listFriends(), listRequests()]);
      setFriends(f);
      setIncoming(r.incoming);
      setOutgoing(r.outgoing);
    } catch (e: any) {
      toast.show(e?.message || t("social.error.load"), "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Procura com debounce (min. 2 caracteres) — igual ao desktop.
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

  const patchResult = (userId: string, relationship: UserSearchResult["relationship"]) => {
    setResults((prev) => prev.map((u) => (u.id === userId ? { ...u, relationship } : u)));
  };

  const handleSend = async (u: UserSearchResult) => {
    try {
      const status = await sendFriendRequest(u.username);
      patchResult(u.id, status === "friends" ? "friends" : "outgoing");
      toast.show(t(status === "friends" ? "social.nowFriends" : "social.requestSent", { username: u.username }), "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || t("social.error.send"), "error");
    }
  };

  const handleAccept = async (r: FriendRequest) => {
    try {
      await acceptFriendRequest(r.id);
      toast.show(t("social.accepted", { username: r.username }), "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || t("social.error.accept"), "error");
    }
  };

  const handleRemoveRequest = async (r: FriendRequest) => {
    try {
      await removeFriendRequest(r.id);
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || t("social.error.removeRequest"), "error");
    }
  };

  const handleRemoveFriend = async (f: Friend) => {
    try {
      await removeFriend(f.id);
      setRemovingFriend(null);
      if (viewing?.id === f.id) setViewing(null);
      toast.show(t("social.removed", { username: f.username }), "success");
      void refresh();
    } catch (e: any) {
      toast.show(e?.message || t("social.error.removeFriend"), "error");
    }
  };

  const openFriend = async (f: Friend) => {
    setViewing(f);
    setViewLoading(true);
    setFriendBets([]);
    try {
      const { bets } = await fetchFriendBets(f.id);
      setFriendBets(bets);
    } catch (e: any) {
      toast.show(e?.message || t("social.error.friendBets"), "error");
    } finally {
      setViewLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Procurar utilizadores */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="search"
placeholder={t("social.searchPlaceholderMobile")}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-11 w-full rounded-full border border-zinc-200 bg-white pl-9 pr-4 text-sm text-zinc-800 outline-none placeholder:text-zinc-400 focus:border-emerald-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500"
        />
      </div>

      {query.trim().length >= 2 && (
        <>
          <SectionHeader>{t("social.results")}</SectionHeader>
          {searching ? (
            <div className="flex items-center justify-center gap-2 py-6 text-xs text-zinc-400 dark:text-zinc-500">
              <Loader2 size={14} className="animate-spin" /> {t("social.searching")}
            </div>
          ) : results.length === 0 ? (
            <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center py-4">{t("social.noUsers")}</p>
          ) : (
            <ListGroup>
              {results.map((u) => (
                <ListItem
                  key={u.id}
                  title={<span className="flex items-center gap-2.5"><Avatar username={u.username} size="w-8 h-8 text-xs" />{u.username}</span>}
                  trailing={
                    u.relationship === "friends" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">{t("social.friends")}</span>
                    ) : u.relationship === "outgoing" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-1"><Clock size={11} /> {t("social.pending")}</span>
                    ) : u.relationship === "incoming" ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{t("social.respondBelow")}</span>
                    ) : (
                      <Pressable
                        as="button"
                        onClick={() => void handleSend(u)}
aria-label={t("social.addAria", { username: u.username })}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 text-white text-xs font-semibold"
                      >
                        <UserPlus size={12} /> {t("social.add")}
                      </Pressable>
                    )
                  }
                />
              ))}
            </ListGroup>
          )}
        </>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-xs text-zinc-400 dark:text-zinc-500">
          <Loader2 size={16} className="animate-spin" /> {t("common.loading")}
        </div>
      ) : (
        <>
          {/* Pedidos recebidos */}
          {incoming.length > 0 && (
            <>
              <SectionHeader>{t("social.incoming")}</SectionHeader>
              <ListGroup>
                {incoming.map((r) => (
                  <ListItem
                    key={r.id}
                    title={<span className="flex items-center gap-2.5"><Avatar username={r.username} size="w-8 h-8 text-xs" />{r.username}</span>}
                    trailing={
                      <span className="flex items-center gap-1.5">
                        <Pressable as="button" onClick={() => void handleAccept(r)} aria-label={t("social.acceptAria", { username: r.username })} className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-600 text-white">
                          <Check size={15} />
                        </Pressable>
                        <Pressable as="button" onClick={() => void handleRemoveRequest(r)} aria-label={t("social.declineAria", { username: r.username })} className="flex items-center justify-center w-9 h-9 rounded-full border border-zinc-200 dark:border-zinc-700 text-zinc-500">
                          <X size={15} />
                        </Pressable>
                      </span>
                    }
                  />
                ))}
              </ListGroup>
            </>
          )}

          {/* Pedidos enviados */}
          {outgoing.length > 0 && (
            <>
              <SectionHeader>{t("social.outgoing")}</SectionHeader>
              <ListGroup>
                {outgoing.map((r) => (
                  <ListItem
                    key={r.id}
                    title={<span className="flex items-center gap-2.5"><Avatar username={r.username} size="w-8 h-8 text-xs" />{r.username}</span>}
subtitle={t("social.waitingReply")}
                    trailing={
                      <Pressable as="button" onClick={() => void handleRemoveRequest(r)} aria-label={t("social.cancelRequestAria", { username: r.username })} className="px-3 py-1.5 rounded-full border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-500">
                        {t("common.cancel")}
                      </Pressable>
                    }
                  />
                ))}
              </ListGroup>
            </>
          )}

          {/* Amigos */}
          <SectionHeader>{t("social.friendsCount", { n: friends.length })}</SectionHeader>
          {friends.length === 0 ? (
            <MobileCard className="text-center py-8">
              <p className="text-sm text-zinc-500 dark:text-zinc-400">{t("social.noFriendsMobile")}</p>
              <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{t("social.noFriendsHint")}</p>
            </MobileCard>
          ) : (
            <ListGroup>
              {friends.map((f) => (
                <ListItem
                  key={f.id}
                  title={<span className="flex items-center gap-2.5"><Avatar username={f.username} />{f.username}</span>}
                  subtitle={f.since ? t("social.friendsSince", { date: formatDate(f.since) }) : undefined}
                  chevron
                  onClick={() => void openFriend(f)}
                />
              ))}
            </ListGroup>
          )}
        </>
      )}

      {/* Perfil do amigo em página-folha */}
      <SheetPage
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? viewing.username : ""}
        footer={
          viewing ? (
            <Pressable
              as="button"
              onClick={() => setRemovingFriend(viewing)}
              className="w-full flex items-center justify-center gap-1.5 py-3 rounded-xl border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-sm font-semibold"
            >
              <UserMinus size={15} /> {t("social.removeFriend")}
            </Pressable>
          ) : undefined
        }
      >
        {viewing && (
          <MobileMemberProfile
            username={viewing.username}
            bets={friendBets}
            currency={currency}
            isDark={isDark}
            loading={viewLoading}
          />
        )}
      </SheetPage>

      {/* Confirmação de remover amigo */}
      <BottomSheet open={!!removingFriend} onClose={() => setRemovingFriend(null)} title={t("social.removeFriendQ")}>
        <div className="space-y-3 pb-2">
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            {t("social.removeFriendDesc", { username: removingFriend?.username ?? "" })}
          </p>
          <div className="grid grid-cols-2 gap-2">
            <Pressable as="button" onClick={() => setRemovingFriend(null)} className="py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-sm font-semibold text-zinc-700 dark:text-zinc-200 text-center">
              {t("common.cancel")}
            </Pressable>
            <Pressable
              as="button"
              onClick={() => removingFriend && void handleRemoveFriend(removingFriend)}
              className="py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold text-center"
            >
              {t("social.remove")}
            </Pressable>
          </div>
        </div>
      </BottomSheet>
    </div>
  );
}
