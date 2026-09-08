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
- [x] Add different language options - dicionário próprio em `src/lib/i18n/`
      (1005 chaves x pt/en), com `scripts/check-i18n.mjs` a correr no `npm run lint`
      e a impedir regressões em 63 ficheiros.
      - A última camada por traduzir era a dos ERROS: o servidor devolve 174
      mensagens em português fixo e o cliente mostrava-as tal e qual
      (`data.error || t("...")`), o que tornava as chaves que já existiam em
      código morto. Agora a chave do cliente ganha (`src/lib/apiError.ts`:
      `apiError` + `messageOf`), e o texto do servidor fica só para diagnóstico.
      - O registo de alterações passa a guardar chave + variáveis em vez da
      frase feita, para acompanhar a mudança de idioma (`src/lib/auditDisplay.ts`).
      - Não se traduz: dados de demonstração, valores de enum que atravessam a
      BD, nomes de casas, `console.log`, e as heurísticas que fazem match em
      texto português de entrada (marcadas com `// i18n-ignore`).

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
- [x] Ajuste no-vig: a odd justa e a margem são gravadas ao lado da crua, com
      de-vig multiplicativo sobre o mercado completo.
      - A cobertura era o teto fixo de 1.25 na soma das probabilidades, que
      recusava tanto as listas de marcadores (bem) como o resultado exato
      completo (mal). Passou a medir-se a margem POR SAÍDA - entre 1.5% e 15% -
      com um limite absoluto de 2 na soma. Medido em duas páginas reais:
      44 -> 82 preços em 85, e 42 -> 80 em 174.
      - A soma total sozinha não separava os dois casos: os marcadores de um
      Lecce - Roma somam 1.39 em 44 saídas e um resultado exato soma 1.67 em 19.
      Nenhum teto que cresça com o número de saídas aceita o segundo e recusa o
      primeiro.
      - `scripts/recon-markets.mjs` mede uma página e grava a fixture; as duas
      que suportam os testes estão em `test/server/fixtures/`. Antes disto
      nenhuma das medições citadas nos comentários era reproduzível.
      - Fica por resolver: um mercado exclusivo a que a página cortou as saídas
      menos prováveis soma abaixo do que devia, e aí o CLV sai otimista. Só uma
      verificação estrutural (o nó do mercado diz quantas saídas tem) resolve.
- [x] Dar o CLV como contexto à IA dos insights.
      - As REGRAS do CLV passaram para `lib/clvMath.ts`, partilhado pelo painel e
      pelo servidor - sem isto havia duas definições de "aposta elegível" a
      divergir em silêncio. `lib/clvProfile.ts` faz o retrato do utilizador
      (média, taxa de bater a linha, por mercado/desporto/casa), sempre a partir
      da base de dados e nunca de números que o cliente mande.
      - Na avaliação de apostas o retrato entra no prompt como contexto sobre
      QUEM pergunta, com a instrução explícita de não mexer na probabilidade
      estimada do jogo - o modelo julga, o código calcula, como no resto da rota.
      - Nas dicas do dia a linha em `daily_insights` continua a ser UMA por
      (dia, idioma): a anotação por utilizador é feita depois, no servidor e sem
      segunda chamada ao modelo. v1 anota, não reordena.
      - Só entram linhas com 5 apostas ou mais: abaixo disso o número é ruído, e
      a IA usa o que lhe derem.
