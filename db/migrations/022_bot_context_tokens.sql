-- ============================================================
-- Migração 022: token de contexto do bot da Betclic (ativação in-app)
--
-- IDEMPOTENTE - pode ser executada várias vezes em segurança.
--
-- Quando um admin "ativa" o bot na app (painel /bot), entrega um token de
-- contexto da Betclic (o mesmo Bearer que a página já usa contra a begmedia).
-- O bot que corre no telemóvel do admin vai buscá-lo aqui no arranque frio, em
-- vez de precisar do BETCLIC_CONTEXT_TOKEN à mão (ver bot/src/index.ts).
--
-- O token é CURTO (~2h) e é do próprio admin, mas mesmo assim nunca fica em
-- claro: token_enc é AES-256-GCM (ver lib/botCrypto.ts). Uma linha por admin -
-- ao reativar, substitui-se (ON CONFLICT). Não guarda a chave da passkey (essa
-- vive só na máquina do admin, cifrada) nem qualquer outro segredo.
-- ============================================================

CREATE TABLE IF NOT EXISTS bot_context_tokens (
  user_id    UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  token_enc  TEXT NOT NULL,                               -- salt.iv.tag.ct (base64), cifrado
  source     TEXT NOT NULL DEFAULT 'manual',              -- 'manual' | 'extension'
  expires_at TIMESTAMP WITH TIME ZONE,                    -- exp do JWT da Betclic, p/ não servir tokens mortos
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW())
);
