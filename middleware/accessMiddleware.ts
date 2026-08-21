// middleware/accessMiddleware.ts
// Portões que ficam a seguir ao authenticateToken: um exige subscrição (ou
// período experimental), o outro exige ser administrador.
//
// Ambos anexam req.access para o handler não ter de voltar a ir à base de
// dados perguntar a mesma coisa.

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./authMiddleware.js";
import { AccessState, isStaff, loadAccess, PLAN, SUBSCRIPTION_REQUIRED } from "../lib/entitlements.js";

export interface AccessRequest extends AuthenticatedRequest {
  access?: AccessState;
}

/**
 * Só deixa passar quem tem acesso às funcionalidades pagas (IA e extensão).
 *
 * Responde 402 Payment Required com um `code` estável: o 401 está reservado
 * para sessão inválida e faria o cliente apagar o token e mandar o utilizador
 * de volta ao login, que é exatamente o oposto do que se quer aqui.
 */
export async function requireSubscription(
  req: AccessRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Token de autenticação em falta." });
    return;
  }

  try {
    const access = await loadAccess(req.user.id);
    if (!access) {
      res.status(401).json({ error: "Utilizador não encontrado." });
      return;
    }

    if (!access.entitled) {
      res.status(402).json({
        code: SUBSCRIPTION_REQUIRED,
        error: "Esta funcionalidade precisa de uma subscrição ativa.",
        trialEndsAt: access.trialEndsAt,
        priceCents: PLAN.priceCents,
        currency: PLAN.currency,
      });
      return;
    }

    req.access = access;
    next();
  } catch (error) {
    console.error("Erro ao validar a subscrição:", error);
    res.status(500).json({ error: "Erro ao validar a subscrição." });
  }
}

/**
 * Exige subscrição APENAS quando o pedido vem da extensão de browser.
 *
 * As rotas das apostas são partilhadas: o site usa-as para registar apostas à
 * mão (grátis) e a extensão usa-as para importar das casas (pago). O que as
 * distingue é a marca "client" gravada no token no momento do login — a
 * extensão pede o token identificando-se, o site não. Como está dentro do
 * JWT, não é algo que se troque num header.
 *
 * Tokens antigos (emitidos antes desta funcionalidade) não têm a marca e
 * passam como se fossem do site; ao fim de 7 dias expiram e o login seguinte
 * já a traz.
 */
export async function requireSubscriptionForExtension(
  req: AccessRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.user?.client !== "extension") {
    next();
    return;
  }
  await requireSubscription(req, res, next);
}

/**
 * Só deixa passar administradores (inclui os fundadores). Devolve 403 e não
 * 404: quem chega aqui já
 * está autenticado, e esconder a existência da rota não acrescenta nada
 * (o painel de gestão nem sequer é mostrado a quem não é administrador).
 */
export async function requireAdmin(
  req: AccessRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user) {
    res.status(401).json({ error: "Token de autenticação em falta." });
    return;
  }

  try {
    const access = await loadAccess(req.user.id);
    if (!access || !isStaff(access.role)) {
      res.status(403).json({ error: "Acesso reservado a administradores." });
      return;
    }
    req.access = access;
    next();
  } catch (error) {
    console.error("Erro ao validar o administrador:", error);
    res.status(500).json({ error: "Erro ao validar as permissões." });
  }
}
