**Bet import .CSV and .JSON**
- [x] Bets file import feature doesnt capture isFreebet, freebetType, isRiskFree, account and maybe others. Fix bug.
      - CSV ganhou colunas FREEBET/FREEBET_TYPE/RISK_FREE/ACCOUNT (export+import, ACCOUNT por etiqueta);
      JSON já levava os campos via mapBetToApi, agora sanitiza accountId obsoleto (evita 400 no lote).

**Bet Import Extension**
- [x] Auto-import when the user logs into a bookie (needs extension login so the
      BetTrackr site doesn't have to be open - see docs/PLAN.md §E3; opt-in, off by default)
      - Login BetTrackr no popup (guarda só o JWT); toggle "importar automaticamente"
      disparado pela captura do token da casa, debounce 10 min/casa; Betano só auto-importa
      se já houver histórico aberto (nunca sequestra o separador). Extensão v1.0.5.

**Configurations**
- [~] Add different language options - infraestrutura i18n + shell traduzidos
      (`src/lib/i18n.tsx`); falta extrair as strings dos separadores (docs/PLAN.md §C1)

**CLV (odd de fecho)**
- [x] Registar a odd de fecho e medir o CLV no painel (desktop + mobile), com
      caixa de entrada para preencher as que faltam, filtro/ordenação no
      histórico e coluna CLOSING_ODDS no CSV. Migração `019_clv_closing_odd.sql`.
- [x] Odds de fecho por perna de múltipla (no `selections` JSONB, sem migração).
      A combinada sai de `combineClosingOdds` e fica `null` enquanto faltar uma perna.
- [x] Captura automática da linha de fecho, sem browser aberto. A Betclic
      responde 403 a qualquer datacenter (medido em AWS us-east, AWS eu-central
      e Azure), por isso quem lê é um agente numa ligação residencial: o
      servidor decide que pernas ler, a casa lê. Janela dos 30 aos 5 minutos
      antes do apito, e o apito que a Betclic anuncia manda sobre o importado.
- [~] Ajuste no-vig: a odd justa e a margem passam a ser gravadas ao lado da
      crua, com de-vig multiplicativo sobre o mercado completo. Falta cobertura:
      só entram mercados que a casa identifica com um `betslipMarketId` e cuja
      soma cai numa banda plausível - 56 preços em 413 numa página de futebol
      medida. Fora disso a perna fica só com a odd crua.
- [ ] Dar o CLV como contexto à IA dos insights.
