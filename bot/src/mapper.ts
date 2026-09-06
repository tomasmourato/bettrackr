// mapper.ts - reutiliza o mapper JA PROVADO da extensao, sem o duplicar nem o
// mover (mexer nele arriscava a extensao, que o importa e testa). Import direto
// do JS ESM; o Node/tsx resolve em runtime. So precisamos destas duas funcoes:
//   mapBetclicBets(raw[]) -> Bet[] prontos para POST /api/bets/bulk
//   betclicRef(bet)       -> a referencia estavel (bet_reference), para dedup
// @ts-ignore - modulo JS sem tipos
import { mapBetclicBets, betclicRef } from "../../extension/src/mapper.js";

export const mapBets: (raw: any[]) => any[] = mapBetclicBets;
export const refOf: (bet: any) => string | null = betclicRef;
