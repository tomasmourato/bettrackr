// enrol.ts - registo automatico da passkey pelo proprio bot, sem terminal.
//
// A mesma cerimonia do `marco0 enrol`, mas chamavel de dentro do daemon: dado um
// token de contexto da Betclic (o que o admin ativa no painel /bot da app), gera
// um par P-256 novo, regista a chave publica na Betclic e devolve a credencial
// para o bot a cifrar no cofre local. A chave privada nasce e fica no
// dispositivo - nunca passa pelo servidor.

import { generateCredential, SoftCredential } from "./softAuthenticator.js";
import { requestRegistrationOptions, submitRegistration } from "./betclicAuth.js";

export async function enrolPasskey(
  contextToken: string,
  deviceName = "BetTrackr Bot",
): Promise<{ cred: SoftCredential; userHandle: Buffer }> {
  const options = await requestRegistrationOptions(contextToken);
  const cred = generateCredential();
  const result = await submitRegistration(contextToken, cred, options, deviceName);
  if (!result.ok) {
    throw new Error(`enrolment da passkey falhou (${result.status}): ${result.body.slice(0, 200)}`);
  }
  return { cred, userHandle: options.userHandle };
}
