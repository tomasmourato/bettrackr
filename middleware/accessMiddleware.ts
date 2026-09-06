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
 * distingue é a marca "client" gravada no token no momento do login - a
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
 * Só deixa passar o fundador.
 *
 * Existe separado do requireAdmin porque nem tudo o que o painel faz deve
 * caber a um administrador promovido. Ver as apostas de qualquer membro é
 * disso o exemplo: são dados privados de quem nunca pediu para os partilhar,
 * e a diferença entre "gerir contas" e "ler o que as pessoas apostam" é
 * grande de mais para ficar no mesmo cargo.
 */
export async function requireFounder(
  req: AccessRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  if (!req.user?.id) {
    res.status(401).json({ error: "Autenticação necessária." });
    return;
  }

  try {
    const access = await loadAccess(req.user.id);
    if (!access || access.role !== "founder") {
      res.status(403).json({ error: "Acesso reservado ao fundador." });
      return;
    }
    req.access = access;
    next();
  } catch (error) {
    console.error("Erro ao validar o fundador:", error);
    res.status(500).json({ error: "Erro ao validar o acesso." });
  }
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

/**
 * Carrega o acesso e segue - nunca recusa.
 *
 * Existe para as rotas que toda a gente pode usar mas cujo CONTEUDO muda com a
 * subscricao. As apostas sao disso o caso: registar e ler apostas e gratis, mas
 * a odd de fecho e o CLV sao pagos, por isso o handler precisa de saber quem
 * esta do outro lado sem que o pedido seja rejeitado.
 *
 * Se a leitura falhar, segue como NAO entitled: numa duvida sobre acesso pago,
 * fechar e o lado seguro para errar.
 */
export async function attachAccess(
  req: AccessRequest,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  if (req.user?.id) {
    try {
      const access = await loadAccess(req.user.id);
      if (access) req.access = access;
    } catch (error) {
      console.error("Erro ao ler o acesso (segue sem ele):", error);
    }
  }
  next();
}
