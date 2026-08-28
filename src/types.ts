export type BetStatus = 'POR_LIQUIDAR' | 'GANHA' | 'PERDIDA' | 'ANULADA' | 'MEIO_GANHA' | 'MEIO_PERDIDA' | 'CASHOUT';
export type BetType = 'SIMPLES' | 'MULTIPLA';
export type SelectionResult = Exclude<BetStatus, 'CASHOUT'>;

// Regra de pagamento de uma freebet:
//  SNR = Stake Not Returned (ganho = (odd-1) * stake) - padrão da indústria
//  SR  = Stake Returned     (ganho = odd * stake)     - variante da Betclic
export type FreebetType = 'SNR' | 'SR';

export interface Selection {
  id: string;
  event: string;
  market: string;
  choice: string;
  odd: number;
  sport?: string;
  betType?: string;
  result?: SelectionResult;
}

export interface BetMetadata {
  screenshotConfidence?: number;
  detectedFields?: string[];
  correctedFields?: string[];
  source?: 'betclic' | 'betano' | string;
  ref?: string | null;
  importKey?: string | null;
  originalStatus?: string | number | null;
  originalReturn?: number | string | null;
  promotionType?: string | null;
  promotionAmount?: number | null;
  bonusType?: string | number | null;
  bonusTokens?: Array<{ type?: string | null; amount?: number | null }>;
  [key: string]: unknown;
}

export interface Bet {
  id: string;
  type: BetType;
  status: BetStatus;
  selections: Selection[];
  stake: number; // For normal bets, this is real cash. For freebets, it's the freebet value.
  odd: number; // Multiplied odds of all selections
  // Odd de fecho: a última odd antes de o evento começar, registada à mão.
  // undefined = ainda não se sabe (e "ainda não sei" é diferente de "não bati
  // a linha" - é isso que a cobertura do CLV mede). Numa múltipla é a odd de
  // fecho combinada, tal como `odd`. Ver src/lib/clv.ts.
  closingOdd?: number;
  isFreebet: boolean;
  freebetType?: FreebetType; // só relevante quando isFreebet; default resolvido pela casa
  // Aposta sem risco: stake é dinheiro REAL e conta para o lucro como uma
  // aposta normal - uma derrota perde a stake. A freebet de reembolso, quando
  // existe, é registada à parte. Mutuamente exclusivo com isFreebet.
  isRiskFree?: boolean;
  // Aposta ignorada: continua visível no histórico mas é excluída de todas as
  // estatísticas (ex.: uma aposta feita para um amigo). O motivo, quando dado,
  // fica no campo `comment`.
  isIgnored?: boolean;
  potentialReturn: number;
  finalReturn: number;
  netProfit: number;
  bookmaker: string;
  // Conta da casa a que a aposta pertence (ver BookieAccount); undefined = "sem conta".
  accountId?: string;
  dateTime: string;
  notes?: string;
  origin: 'MANUAL' | 'SCREENSHOT' | 'CSV';
  comment?: string;
  tags?: string;
  metadata?: BetMetadata;
}

// ------------------------------------------------------------
// Conta numa casa de apostas. Um utilizador pode ter várias contas na mesma
// casa (ex.: duas contas Betclic) e associar cada aposta a uma delas.
// ------------------------------------------------------------
export interface BookieAccount {
  id: string;
  bookmaker: string;
  label: string;
  // Username real na casa (ex.: "pedroocoragem" na Betclic); a extensão usa-o
  // para encaminhar automaticamente as apostas importadas. undefined = sem username.
  username?: string;
  createdAt?: string;
}

// ------------------------------------------------------------
// Banca. Só entra aqui dinheiro real a entrar e a sair das casas - o saldo é
// derivado destes movimentos mais o lucro das apostas já liquidadas, por isso
// uma aposta nunca precisa de ser lançada à mão. Ver src/lib/bankroll.ts.
// ------------------------------------------------------------
export type BankrollMovementKind = 'DEPOSITO' | 'LEVANTAMENTO' | 'AJUSTE';

export interface BankrollMovement {
  id: string;
  kind: BankrollMovementKind;
  // Efeito com sinal na banca: depósito positivo, levantamento negativo.
  // O AJUSTE é o único que pode ir nos dois sentidos.
  amount: number;
  // "YYYY-MM-DD HH:mm", o mesmo formato de Bet.dateTime.
  occurredAt: string;
  note?: string;
  // Reservado para a banca por conta; hoje fica sempre undefined.
  accountId?: string;
  createdAt?: string;
}

/** Um ponto da evolução do saldo, já com o acumulado. */
export interface BankrollPoint {
  at: string;
  balance: number;
  delta: number;
  source: 'MOVEMENT' | 'BET';
}

export interface BankrollSummary {
  balance: number;
  deposited: number;
  withdrawn: number;
  adjustments: number;
  betsProfit: number;
  /** Dinheiro real preso em apostas por liquidar. */
  exposure: number;
  available: number;
  /** Lucro sobre o capital depositado. null quando não há depósitos. */
  roi: number | null;
  /** Maior queda pico-a-vale, em dinheiro e positiva. */
  maxDrawdown: number;
  maxDrawdownPct: number | null;
  /** false quando não há movimentos nenhuns: a UI mostra o estado vazio. */
  hasData: boolean;
  series: BankrollPoint[];
}

export type ThemeMode = 'light' | 'dark' | 'system';
export type Language = 'pt' | 'en';

// ------------------------------------------------------------
// Social (amizades)
// ------------------------------------------------------------
// Relação entre o utilizador autenticado e outro, do ponto de vista de "mim":
//  none     -> sem relação
//  friends  -> amizade aceite
//  incoming -> o outro enviou-me um pedido (posso aceitar)
//  outgoing -> eu enviei-lhe um pedido (aguarda resposta)
export type Relationship = 'none' | 'friends' | 'incoming' | 'outgoing';

export interface Friend {
  id: string;
  username: string;
  since?: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  relationship: Relationship;
}

export interface FriendRequest {
  id: string;        // id da linha de amizade (para aceitar/recusar/cancelar)
  user_id: string;   // id do outro utilizador
  username: string;
  created_at: string;
}

export interface Preferences {
  currency: string;
  defaultBookmaker: string;
  defaultStake: number;
  theme: ThemeMode;
  language: Language;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
}

export interface DashboardStats {
  totalBets: number;
  pendingBets: number;
  wonBets: number;
  lostBets: number;
  refundedBets: number; // Anuladas
  halfWonBets: number;
  halfLostBets: number;
  cashoutBets: number;
  totalStake: number;
  totalReturn: number;
  netProfit: number;
  // Lucro líquido sobre o volume apostado. O ROI sobre o capital depositado
  // vive na banca (BankrollSummary.roi), que é a única que sabe os depósitos.
  yield: number; // (netProfit / totalStake) * 100
  winRate: number; // (won + 0.5 * halfWon) / settled bets * 100
}

export interface FilteredBetsSummary {
  settledStake: number;
  pendingStake: number;
  freebetStake: number;
  totalReturn: number;
  netProfit: number;
  betCount: number;
}
