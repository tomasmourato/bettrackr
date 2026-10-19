// lib/clvAgentHealth.ts
// Quando é que o agente de CLV conta como parado. Lógica pura, partilhada pelo
// vigia no servidor (lib/botWatch.ts) e pelo painel do bot (BotPanel.tsx): os
// dois têm de responder igual à pergunta "o agente está vivo?".
//
// PROPOSITADAMENTE SEM IMPORTS: o painel importa isto, e não pode arrastar o pg.
//
// Porque existe: a 11/10/2026 às 03:35 o agente deixou de reportar e ficou uma
// semana calado. Nenhuma aposta teve odd de fecho nesse tempo e o painel
// continuava a mostrar a última passagem com um «OK» verde - quem olhava via
// tudo bem. O bot tinha vigia desde 13/09; o agente não tinha nenhum.

/**
 * O agente corre de 5 em 5 minutos (cron do telemóvel). Meia hora sem nada são
 * seis passagens perdidas - uma janela de leitura inteira, que abre aos 30
 * minutos do apito. Abaixo disto seria ruído de rede.
 */
export const CLV_AGENT_STALL_AFTER_MS = 30 * 60 * 1000;

/** A passagem de captura mais recente de uma lista ordenada da mais nova para a mais velha. */
export function lastCaptureRun<T extends { kind: string }>(runs: T[]): T | undefined {
  // A passagem de madrugada (odds do dia) corre uma vez por dia: não diz nada
  // sobre se a captura de 5 em 5 minutos está viva.
  return runs.find((run) => run.kind !== "daily");
}

/** A captura está calada há mais do que o limite? Sem passagem nenhuma não há o que vigiar. */
export function clvAgentSilent(lastRunAt: string | Date | null | undefined, now: number): boolean {
  if (!lastRunAt) return false;
  const at = lastRunAt instanceof Date ? lastRunAt.getTime() : Date.parse(lastRunAt);
  if (Number.isNaN(at)) return false;
  return now - at > CLV_AGENT_STALL_AFTER_MS;
}
