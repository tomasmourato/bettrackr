// jwt.ts - so o que o bot precisa de um JWT: saber quando expira. NAO verifica
// a assinatura (nao e nosso o segredo, e nao e preciso) - so descodifica o
// payload para ler o `exp`. Serve para decidir se o token de contexto ainda
// serve para o login seguinte.

export function decodeExp(token: string): number | null {
  try {
    const payload = token.split(".")[1];
    const json = Buffer.from(payload.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const exp = JSON.parse(json)?.exp;
    return typeof exp === "number" ? exp : null;
  } catch {
    return null;
  }
}

// Ainda valido daqui a `marginSec` segundos? (margem para nao usar um token
// que morre a meio do ciclo.) Um token sem `exp` conta como expirado.
export function isUsable(token: string, marginSec = 120): boolean {
  const exp = decodeExp(token);
  if (exp === null) return false;
  return exp * 1000 > Date.now() + marginSec * 1000;
}
