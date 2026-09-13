// src/lib/push.ts
// Notificações push na app Android: Firebase Cloud Messaging através do
// @capacitor/push-notifications. No-op na web e nos APKs antigos - o live update
// entrega este código a todas as instalações, mas só um APK compilado com o
// plugin nativo (e com o google-services.json) o consegue usar.
//
// Quem se regista decide-se fora, no App.tsx: só quem tem o bot, que é quem
// recebe alertas. Pedir licença para notificações a quem nunca vai receber
// nenhuma seria só um incómodo.

import type { PluginListenerHandle } from "@capacitor/core";
import { isNativeApp } from "./apiBase";
import { registerPushDevice, unregisterPushDevice } from "./notificationsApi";
import { STORAGE_KEYS } from "./storageKeys";

/** O mesmo id do servidor (PUSH_CHANNEL_ID em lib/push.ts). */
const CHANNEL_ID = "bot_alerts";

/** Disparado na janela quando chega um push com a app aberta: as listas relêem-se. */
export const PUSH_RECEIVED_EVENT = "bettrackr:push-received";

export type PushPermission = "granted" | "denied" | "prompt" | "unavailable";

/**
 * O plugin, só quando este APK o traz.
 *
 * A pergunta faz-se ao @capacitor/core, importado aqui, e NÃO ao window.Capacitor:
 * o core não vem no bundle principal, e até ser carregado o window.Capacitor é o
 * da ponte nativa, cujo isPluginAvailable só conhece os plugins já importados -
 * respondia sempre que não. Foi assim que o APK 1.0.4 nunca pediu licença nem
 * registou o telemóvel (13/09/2026). O do core consulta os PluginHeaders que o
 * Android injeta, por isso num APK sem o plugin nativo continua a dizer que não.
 */
async function loadPlugin() {
  if (!isNativeApp()) return null;
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isPluginAvailable("PushNotifications")) return null;
    const { PushNotifications } = await import("@capacitor/push-notifications");
    return PushNotifications;
  } catch {
    return null;
  }
}

export async function getPushPermission(): Promise<PushPermission> {
  const push = await loadPlugin();
  if (!push) return "unavailable";
  try {
    const { receive } = await push.checkPermissions();
    if (receive === "granted") return "granted";
    return receive === "denied" ? "denied" : "prompt";
  } catch {
    return "unavailable";
  }
}

export interface StartPushOptions {
  /** Nome e descrição do canal, como aparecem nas definições do Android. */
  channelName: string;
  channelDescription: string;
  /** Tocou-se numa notificação; `data` é o que o servidor mandou com ela. */
  onOpen: (data: Record<string, string>) => void;
}

/**
 * Pede licença (se ainda não houver resposta), cria o canal e regista o
 * telemóvel no servidor. Devolve a função que desliga os listeners.
 */
export async function startPush(options: StartPushOptions): Promise<() => void> {
  const push = await loadPlugin();
  if (!push) return () => undefined;

  const handles: PluginListenerHandle[] = [];
  const stop = () => {
    for (const handle of handles) void handle.remove();
  };

  try {
    let { receive } = await push.checkPermissions();
    if (receive === "prompt" || receive === "prompt-with-rationale") {
      ({ receive } = await push.requestPermissions());
    }
    if (receive !== "granted") return stop;

    await push.createChannel({
      id: CHANNEL_ID,
      name: options.channelName,
      description: options.channelDescription,
      importance: 4, // alta: aparece por cima do que estiver no ecrã
      visibility: 1, // pública: vê-se com o telemóvel bloqueado
    });

    handles.push(
      await push.addListener("registration", ({ value }) => {
        try {
          localStorage.setItem(STORAGE_KEYS.pushToken, value);
        } catch {
          // Sem storage só se perde o "esquecer ao sair da conta".
        }
        void registerPushDevice(value).catch(() => undefined);
      }),
    );
    handles.push(
      await push.addListener("registrationError", (failure) => {
        console.warn("[push] registo falhou:", failure?.error);
      }),
    );
    handles.push(
      await push.addListener("pushNotificationReceived", () => {
        window.dispatchEvent(new Event(PUSH_RECEIVED_EVENT));
      }),
    );
    handles.push(
      await push.addListener("pushNotificationActionPerformed", ({ notification }) => {
        options.onOpen((notification?.data ?? {}) as Record<string, string>);
      }),
    );

    await push.register();
  } catch (failure) {
    // Sem google-services.json o Firebase não arranca e o register() rebenta: a
    // app segue sem push, e a página de notificações diz porquê.
    console.warn("[push] sem push:", failure);
  }
  return stop;
}

/**
 * Ao sair da conta: o servidor esquece este telemóvel, para ele deixar de
 * receber os alertas de quem saiu. Tem de correr ANTES de se apagar a sessão -
 * o pedido vai autenticado com ela (o authFetch lê o token logo à chamada).
 */
export function forgetPushDevice(): void {
  let token: string | null = null;
  try {
    token = localStorage.getItem(STORAGE_KEYS.pushToken);
    localStorage.removeItem(STORAGE_KEYS.pushToken);
  } catch {
    return;
  }
  if (token) void unregisterPushDevice(token).catch(() => undefined);
}
