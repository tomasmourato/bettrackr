**Bet import .CSV and .JSON**
- [x] Bets file import feature doesnt capture isFreebet, freebetType, isRiskFree, account and maybe others. Fix bug.
      - CSV ganhou colunas FREEBET/FREEBET_TYPE/RISK_FREE/ACCOUNT (export+import, ACCOUNT por etiqueta);
      JSON já levava os campos via mapBetToApi, agora sanitiza accountId obsoleto (evita 400 no lote).

**Bet Import Extension**
- [x] Auto-import when the user logs into a bookie (needs extension login so the
      BetTrackr site doesn't have to be open - see PLAN.md §E3; opt-in, off by default)
      - Login BetTrackr no popup (guarda só o JWT); toggle "importar automaticamente"
      disparado pela captura do token da casa, debounce 10 min/casa; Betano só auto-importa
      se já houver histórico aberto (nunca sequestra o separador). Extensão v1.0.5.

**Configurations**
- [~] Add different language options - infraestrutura i18n + shell traduzidos
      (`src/lib/i18n.tsx`); falta extrair as strings dos separadores (PLAN.md §C1)

**CLV (odd de fecho)**
- [x] Registar a odd de fecho e medir o CLV no painel (desktop + mobile), com
      caixa de entrada para preencher as que faltam, filtro/ordenação no
      histórico e coluna CLOSING_ODDS no CSV. Migração `019_clv_closing_odd.sql`.
- [ ] Odds de fecho por perna de múltipla (cabem no `selections` JSONB, sem migração).
- [ ] Ajuste no-vig: hoje a odd de fecho é usada crua, com a margem da casa lá
      dentro, o que faz o CLV pecar por defeito em 2-5 pontos percentuais.
- [ ] Captura automática da linha de fecho (API de odds ou extensão) - hoje a
      odd de fecho é sempre escrita à mão.
- [ ] Dar o CLV como contexto à IA dos insights.
