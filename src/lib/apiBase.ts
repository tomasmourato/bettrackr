// src/lib/apiBase.ts
// Base URL da API. Na web os caminhos relativos ("/api/...") funcionam porque
// o frontend e a API partilham a origem. Na app nativa (Capacitor) os assets
// são servidos localmente (https://localhost), por isso as chamadas têm de
// apontar explicitamente para o servidor.
//
// Prioridade: VITE_API_BASE_URL (definida no build) > produção quando corre
// dentro do Capacitor > relativo (web).
//
// ATENÇÃO ao mexer neste domínio: ele fica gravado dentro do APK e as apps já
// instaladas continuam a chamá-lo para sempre. Se ele deixar de servir a API,
// essas apps ficam sem base de dados E sem o /app-version.json que as
// atualizaria - não há como as consertar à distância. Já aconteceu: renomear o
// projeto na Vercel deixou o domínio antigo a devolver só 301. Por isso a app
// nativa faz os pedidos pelo HTTP nativo (CapacitorHttp em capacitor.config.ts),
// que segue redirecionamentos e ignora CORS; um domínio que redirecione para o
// novo continua a funcionar. Um domínio próprio (que sobrevive a mudanças de
// nome do projeto) seria mais seguro do que este *.vercel.app.

const PRODUCTION_API = "https://betrackr.vercel.app";

/** True quando a app corre dentro da shell nativa do Capacitor. */
export function isNativeApp(): boolean {
  try {
    return Boolean((window as any).Capacitor?.isNativePlatform?.());
  } catch {
    return false;
  }
}

// `?.` em env: no bundle CJS do servidor (SSR) o esbuild substitui
// `import.meta` por `{}`, e o acesso direto a `.env.VITE_...` rebentava no
// carregamento do módulo. No browser/Vite continua a ler a variável do build.
const configured = (import.meta.env?.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_BASE: string = configured
  ? configured.replace(/\/+$/, "")
  : isNativeApp()
    ? PRODUCTION_API
    : "";

/** Prefixa um caminho da API ("/api/...") com a base correta para a plataforma. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}
