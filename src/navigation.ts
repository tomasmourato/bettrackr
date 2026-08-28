// Navegação e contrato de shell partilhados entre o shell desktop
// (src/DesktopApp.tsx) e o shell mobile (src/mobile/MobileApp.tsx). Manter
// os separadores e os caminhos aqui garante que os dois layouts nunca
// divergem. O App.tsx é apenas um switch de plataforma que injeta o mesmo
// ShellProps em qualquer um dos shells.

import React from "react";
import {
  LayoutDashboard,
  Layers,
  Sparkles,
  Settings as SettingsIcon,
  ShieldCheck,
  Users,
  Lightbulb,
} from "lucide-react";

import type { Bet, Preferences, BookieAccount, AuditLog, BankrollMovement } from "./types";
import type { BankrollMovementInput } from "./lib/bankrollApi";
import type { DashboardBetsFilters } from "./components/Dashboard";
import type { getStoredUser } from "./lib/authApi";
import type { BillingStatus } from "./lib/billingApi";
import type { TFn, TKey } from "./lib/i18n";

export type AppTab =
  | "DASHBOARD"
  | "BETS"
  | "IMPORT"
  | "INSIGHTS"
  | "SOCIAL"
  | "SETTINGS"
  | "ADMIN";

export const TAB_PATHS: Record<AppTab, string> = {
  DASHBOARD: "/dashboard",
  BETS: "/bets",
  IMPORT: "/import",
  INSIGHTS: "/insights",
  SOCIAL: "/social",
  SETTINGS: "/settings",
  ADMIN: "/admin",
};

// Separadores que exigem subscrição. O bloqueio a sério é do servidor (402);
// esta lista é só para os shells saberem quando mostrar o convite a subscrever
// em vez do ecrã.
export const PAID_TABS: ReadonlySet<AppTab> = new Set<AppTab>(["IMPORT", "INSIGHTS"]);

export const tabFromPath = (pathname: string): AppTab => {
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const matchingTab = (Object.entries(TAB_PATHS) as Array<[AppTab, string]>)
    .find(([, path]) => path === normalizedPath)?.[0];

  return matchingTab || "DASHBOARD";
};

export interface NavItem {
  tab: AppTab;
  icon: React.ComponentType<{ size?: number | string; className?: string }>;
  // Chaves de tradução (tipadas): um separador novo sem entrada no dicionário
  // não compila.
  navKey: TKey;
  footerKey: TKey;
}

// Navegação única para a sidebar (desktop) e a tab bar (mobile), para os
// separadores nunca divergirem entre layouts.
export const NAV_ITEMS: NavItem[] = [
  { tab: "DASHBOARD", icon: LayoutDashboard, navKey: "nav.overview", footerKey: "footer.panel" },
  { tab: "BETS", icon: Layers, navKey: "nav.bets", footerKey: "footer.bets" },
  { tab: "IMPORT", icon: Sparkles, navKey: "nav.import", footerKey: "footer.ai" },
  { tab: "INSIGHTS", icon: Lightbulb, navKey: "nav.insights", footerKey: "footer.insights" },
  { tab: "SOCIAL", icon: Users, navKey: "nav.social", footerKey: "footer.social" },
  { tab: "SETTINGS", icon: SettingsIcon, navKey: "nav.settings", footerKey: "footer.settings" },
];

const ADMIN_NAV_ITEM: NavItem = {
  tab: "ADMIN",
  icon: ShieldCheck,
  navKey: "nav.admin",
  footerKey: "footer.admin",
};

export type UserRole = "user" | "admin" | "founder";

/**
 * Quem vê o painel de gestão. Vive aqui sozinha porque a pergunta é feita em
 * dois sítios - a lista de separadores e o guarda do separador ativo no
 * App.tsx - e responder a cada um por si já deixou o fundador de fora uma vez.
 *
 * Esconder o separador é comodidade e não segurança: as rotas /api/admin
 * respondem 403 a quem não tem o papel, venha o pedido de onde vier.
 */
export function canSeeAdmin(role: UserRole | undefined): boolean {
  return role === "admin" || role === "founder";
}

/** Separadores a mostrar a este utilizador. */
export function navItemsFor(role: UserRole | undefined): NavItem[] {
  return canSeeAdmin(role) ? [...NAV_ITEMS, ADMIN_NAV_ITEM] : NAV_ITEMS;
}

export type StoredUser = ReturnType<typeof getStoredUser>;

// Contrato partilhado: tudo o que um shell precisa de renderizar a app. O
// App.tsx é dono do estado (hooks) e dos handlers; os shells são só a
// apresentação. Ambos os shells recebem exatamente este objeto.
export interface ShellProps {
  // Navegação
  activeTab: AppTab;
  // Query string atual (filtros no URL) - passada como initialSearch ao
  // Dashboard/BetsManager para links partilhados e drill-downs do dashboard.
  locationSearch: string;
  // False durante o primeiro render (hidratação do SSR): os shells devem
  // suprimir animações de entrada para o HTML do servidor não piscar.
  routeAnimationsReady: boolean;
  navigateToTab: (tab: AppTab) => void;
  navigateToFilteredBets: (filters: DashboardBetsFilters) => void;

  // Conta / sessão
  currentUser: StoredUser;
  isAccountOpen: boolean;
  setIsAccountOpen: (open: boolean) => void;
  onLogout: () => void;
  onSessionExpired: () => void;

  // Preferências / tema / i18n
  preferences: Preferences;
  onUpdatePreferences: (prefs: Preferences) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  // Mesma função que o useI18n() devolve - os shells já a recebem por props,
  // o resto da árvore usa o hook.
  t: TFn;

  // Estado de rede
  isOnline: boolean;

  // Subscrição - null enquanto não se sabe (a carregar ou sem resposta).
  // Os ecrãs pagos tratam null como "ainda não sei" e não mostram o paywall.
  subscription: BillingStatus | null;
  subscriptionLoading: boolean;
  refreshSubscription: () => Promise<void>;

  // Apostas
  bets: Bet[];
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
  onRefresh: () => Promise<void>;
  onAddBet: (bet: Bet) => Promise<void>;
  onUpdateBet: (bet: Bet) => Promise<void>;
  onIgnoreBet: (id: string, ignored: boolean, comment?: string | null) => Promise<void>;
  onDeleteBet: (id: string) => Promise<void>;
  onDuplicateBets: (bets: Bet[]) => Promise<void>;
  onImportCSV: (bets: Bet[]) => Promise<void>;
  onClearData: () => Promise<void>;
  onResetDemoData: () => Promise<void>;

  // Contas por casa de apostas
  accounts: BookieAccount[];
  accountsError: string | null;
  clearAccountsError: () => void;
  onAddAccount: (bookmaker: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onRenameAccount: (id: string, label: string, username?: string | null) => Promise<BookieAccount | null>;
  onDeleteAccount: (id: string) => Promise<boolean>;

  // Banca. Só movimentos de dinheiro real; o saldo é derivado destes mais o
  // lucro das apostas liquidadas (calculateBankroll, src/lib/bankroll.ts).
  bankrollMovements: BankrollMovement[];
  /** Saldo já derivado, para o Kelly dos insights falar em dinheiro. */
  bankrollBalance: number;
  bankrollError: string | null;
  clearBankrollError: () => void;
  onAddMovement: (input: BankrollMovementInput) => Promise<BankrollMovement | null>;
  onEditMovement: (id: string, input: BankrollMovementInput) => Promise<BankrollMovement | null>;
  onDeleteMovement: (id: string) => Promise<boolean>;
  /** Restauro dos movimentos vindos de um backup JSON (versão "1.1" para cima). */
  onImportBankroll: (movements: BankrollMovement[]) => Promise<void>;

  // Auditoria
  auditLogs: AuditLog[];
}
