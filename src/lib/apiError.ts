// src/lib/apiError.ts
// Erros de API traduzidos.
//
// O servidor fala português fixo - 174 respostas `res.json({ error: "..." })`.
// O cliente mostrava-as tal e qual, e a chave de tradução ao lado nunca
// chegava a correr:
//
//     setError(e?.message || t("errors.social.friends"));
//
// O `e.message` traz sempre o português do servidor, por isso o `||` nunca
// passa para a direita. A app ficava traduzida até algo correr mal.
//
// Aqui a precedência é a contrária: cada chamada de API lança um ApiError que
// carrega a CHAVE da operação, e o ecrã mostra `messageOf(err, t)`. O texto do
// servidor fica em `serverMessage`, para o console e para quem investiga - não
// para o utilizador.
//
// A exceção é o `code`. Quando o servidor devolve um código estável
// (routes/authRoutes.ts, routes/billingRoutes.ts) esse código diz mais do que
// a chave da operação, por isso quem o sabe interpretar - useChangePassword,
// useBillingActions - traduz o código primeiro e só depois cai aqui.

import type { TFn, TKey, TVars } from "./i18n";

/**
 * Erro com frase traduzível própria. Serve para o que a app lança sozinha
 * (validações, leitura de ficheiros) sem haver resposta HTTP pelo meio.
 */
export class LocalizedError extends Error {
  readonly key: TKey;
  readonly vars?: TVars;

  constructor(key: TKey, vars?: TVars) {
    // A `message` é diagnóstico. O que o utilizador lê sai do `messageOf`.
    super(key);
    this.name = "LocalizedError";
    this.key = key;
    this.vars = vars;
  }
}

/** Erro vindo de uma resposta HTTP que não veio OK. */
export class ApiError extends LocalizedError {
  readonly status: number;
  readonly code?: string;
  /** O que o servidor escreveu, em português. Diagnóstico apenas. */
  readonly serverMessage?: string;

  constructor(key: TKey, status: number, code?: string, serverMessage?: string) {
    super(key);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.serverMessage = serverMessage;
    this.message = `${key} (HTTP ${status}${code ? " " + code : ""})`;
  }
}

/**
 * O erro de uma resposta que não veio OK, já com a chave da operação.
 * `data` é o corpo lido pelo parseJsonResponse - pode estar vazio.
 */
export function apiError(data: any, res: Response, key: TKey): ApiError {
  return new ApiError(key, res.status, data?.code ?? undefined, data?.error ?? undefined);
}

/**
 * A frase a mostrar ao utilizador.
 *
 * O `fallback` só entra quando o erro não traz chave nenhuma - uma falha de
 * rede, um `throw` de terceiros. Um erro nosso traz sempre a sua.
 */
export function messageOf(err: unknown, t: TFn, fallback: TKey = "errors.generic"): string {
  if (err instanceof LocalizedError) return t(err.key, err.vars);
  return t(fallback);
}
