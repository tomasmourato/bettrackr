// src/lib/i18n/pt.ts
// Dicionário português — a FONTE DE VERDADE das chaves. Todas as outras
// línguas são tipadas contra este ficheiro (ver en.ts): acrescentar uma chave
// aqui sem a traduzir lá é um erro de compilação, não um bug em produção.
//
// Convenção das chaves: "<área>.<subárea>.<nome>", em minúsculas/camelCase.
// Uma entrada é um texto simples ou um par singular/plural escolhido por
// `t(key, { n })`. Os marcadores `{nome}` são substituídos pelas variáveis
// passadas ao `t()`.

export type Plural = { one: string; other: string };
export type Entry = string | Plural;

export const PT = {
  // ----------------------------------------------------------------
  // Comum (usado em vários ecrãs)
  // ----------------------------------------------------------------
  "common.save": "Guardar",
  "common.cancel": "Cancelar",
  "common.yes": "Sim",
  "common.no": "Não",
  "common.loading": "A carregar…",
  "common.clear": "Limpar",
  "common.clearAll": "Limpar tudo",
  "common.confirm": "Confirmar",
  "common.edit": "Editar",
  "common.delete": "Apagar",
  "common.filters": "Filtros",
  "common.from": "De",
  "common.to": "Até",

  // ----------------------------------------------------------------
  // Estados de aposta (partilhados pelo painel e pelo histórico)
  // ----------------------------------------------------------------
  "status.won": "Ganha",
  "status.halfWon": "Meio ganha",
  "status.cashout": "Cashout",
  "status.void": "Anulada",
  "status.halfLost": "Meio perdida",
  "status.lost": "Perdida",
  "status.pending": "Pendente",
  "status.unsettled": "Por liquidar",
  "status.unsettledLong": "Por liquidar (pendente)",
  "status.resolved": "Resolvidas",

  // ----------------------------------------------------------------
  // Vocabulário de apostas (fallbacks e etiquetas soltas)
  // ----------------------------------------------------------------
  "bet.multiple": "Múltipla",
  "bet.various": "Vários",
  "bet.otherBookmaker": "Outra",
  "bet.noDate": "Sem data",
  "bet.noData": "Sem dados",
  "bet.start": "Início",

  // ----------------------------------------------------------------
  // Filtros (painel + histórico)
  // ----------------------------------------------------------------
  "filters.bookmaker": "Casa de apostas",
  "filters.account": "Conta",
  "filters.sport": "Desporto",
  "filters.type": "Tipo",
  "filters.money": "Dinheiro",
  "filters.period": "Período",
  "filters.allFem": "Todas",
  "filters.allMasc": "Todos",
  "filters.allBookmakers": "Todas as casas",
  "filters.allAccounts": "Todas as contas",
  "filters.allSports": "Todos os desportos",
  "filters.noAccount": "Sem conta",
  "filters.anyType": "Qualquer tipo",
  "filters.allStatuses": "Todos os estados",
  "filters.status": "Estado",
  "filters.statusAria": "Filtrar por estado",
  "filters.type.single": "Simples",
  "filters.type.multiple": "Múltipla",
  "filters.money.all": "Dinheiro e freebet",
  "filters.money.real": "Dinheiro real",
  "filters.money.freebet": "Freebet",
  "filters.money.riskFree": "Sem risco",
  "filters.bookmakerAria": "Filtrar por casa de apostas",
  "filters.accountAria": "Filtrar por conta",
  "filters.sportAria": "Filtrar por desporto",
  "filters.typeAria": "Filtrar por tipo de aposta",
  "filters.moneyAria": "Filtrar por tipo de dinheiro",

  // ----------------------------------------------------------------
  // Períodos (chips do painel mobile)
  // ----------------------------------------------------------------
  "timeframe.all": "Todo o período",
  "timeframe.7days": "7 dias",
  "timeframe.30days": "30 dias",
  "timeframe.90days": "90 dias",
  "timeframe.thisMonth": "Este mês",
  "timeframe.thisYear": "Este ano",
  "timeframe.custom": "Personalizado",
  "timeframe.last7": "Últimos 7 dias",
  "timeframe.last30": "Últimos 30 dias",
  "timeframe.last90": "Últimos 90 dias",
  "timeframe.customRange": "Período personalizado",
  "timeframe.aria": "Filtrar por período",
  "timeframe.pickerAria": "Escolher período personalizado",
  "timeframe.rangeHint": "As datas inicial e final são incluídas.",
  "timeframe.startDate": "Data inicial",
  "timeframe.endDate": "Data final",
  "timeframe.datePlaceholder": "dd/mm/aaaa",
  "timeframe.prevMonth": "Mês anterior",
  "timeframe.nextMonth": "Mês seguinte",

  // ----------------------------------------------------------------
  // Autenticação (ecrã de login/registo)
  // ----------------------------------------------------------------
  "auth.login": "Entrar",
  "auth.signup": "Criar conta",
  "auth.usernamePlaceholder": "o_teu_username",
  "auth.emailPlaceholder": "tu@exemplo.com",
  "auth.password": "Password",
  "auth.passwordHint": "Mínimo 8 caracteres.",
  "auth.loading": "Aguarda…",
  "auth.noAccount": "Ainda não tens conta?",
  "auth.register": "Regista-te",
  "auth.hasAccount": "Já tens conta?",
  "auth.signin": "Inicia sessão",
  "auth.genericError": "Ocorreu um erro. Tenta novamente.",

  // ----------------------------------------------------------------
  // Ecrã de erro (ErrorBoundary)
  // ----------------------------------------------------------------
  "error.title": "Algo correu mal",
  "error.desc":
    "A página não conseguiu carregar. Tenta recarregar; se persistir, o detalhe abaixo ajuda-nos a corrigir.",
  "error.reload": "Recarregar",

  // ----------------------------------------------------------------
  // Social (Social desktop + MobileSocial)
  // ----------------------------------------------------------------
  "social.title": "Social",
  "social.subtitle": "Adiciona amigos para verem as estatísticas e apostas uns dos outros.",
  "social.addFriend": "Adicionar amigo",
  "social.searchPlaceholder": "Procurar por username…",
  "social.searchPlaceholderMobile": "Procurar utilizadores…",
  "social.searching": "A procurar…",
  "social.noUsers": "Nenhum utilizador encontrado.",
  "social.results": "Resultados",
  "social.friends": "Amigos",
  "social.friendsCount": "Amigos ({n})",
  "social.pending": "Pendente",
  "social.askedYou": "Pediu-te",
  "social.respondBelow": "Respondei ao pedido ↓",
  "social.add": "Adicionar",
  "social.incoming": "Pedidos recebidos",
  "social.outgoing": "Pedidos enviados",
  "social.sent": "Enviados",
  "social.noPending": "Sem pedidos pendentes.",
  "social.noFriends": "Ainda não tens amigos. Procura por username acima.",
  "social.noFriendsMobile": "Ainda não tens amigos adicionados.",
  "social.noFriendsHint": "Procura utilizadores acima para enviar pedidos.",
  "social.viewStats": "Ver estatísticas e apostas →",
  "social.removeFriend": "Remover amigo",
  "social.removeFriendQ": "Remover amigo?",
  "social.removeFriendDesc":
    "Deixarás de ver as estatísticas de {username} e ele deixará de ver as tuas.",
  "social.remove": "Remover",
  "social.back": "Voltar",
  "social.friendProfile": "Perfil de amigo",
  "social.loadingStats": "A carregar as estatísticas de {username}…",
  "social.friendBets": "Apostas de {username}",
  "social.recentBets": "As 50 apostas mais recentes ({total} no total)",
  "social.recentBetsMobile": "Apostas recentes ({total} no total)",
  "social.noFriendBets": "Este amigo ainda não registou apostas.",
  "social.waitingReply": "À espera de resposta",
  "social.friendsSince": "Amigos desde {date}",
  "social.accept": "Aceitar",
  "social.decline": "Recusar",
  "social.acceptAria": "Aceitar {username}",
  "social.declineAria": "Recusar {username}",
  "social.addAria": "Adicionar {username}",
  "social.cancelRequestAria": "Cancelar pedido a {username}",
  "social.nowFriends": "Agora és amigo de {username}.",
  "social.requestSent": "Pedido enviado a {username}.",
  "social.accepted": "Aceitaste o pedido de {username}.",
  "social.removed": "{username} removido dos amigos.",
  "social.table.event": "Evento",
  "social.error.load": "Erro ao carregar os dados sociais.",
  "social.error.send": "Erro ao enviar o pedido.",
  "social.error.accept": "Erro ao aceitar o pedido.",
  "social.error.removeRequest": "Erro ao remover o pedido.",
  "social.error.removeFriend": "Erro ao remover a amizade.",
  "social.error.friendBets": "Erro ao obter as apostas do amigo.",

  // ----------------------------------------------------------------
  // Navegação / shell
  // ----------------------------------------------------------------
  "nav.overview": "Visão Geral",
  "nav.bets": "Meus Boletins",
  "nav.import": "Importar com IA",
  "nav.insights": "AI Insights",
  "footer.insights": "Dicas",
  "nav.social": "Social",
  "nav.settings": "Configurações",
  "nav.logout": "Sair",
  "nav.install": "Instalar",
  "footer.panel": "Painel",
  "footer.bets": "Boletins",
  "footer.ai": "IA",
  "footer.social": "Social",
  "footer.settings": "Ajustes",
  "app.loadingBets": "A carregar apostas…",
  "app.brandTagline": "Gestão de Apostas",

  // ----------------------------------------------------------------
  // Painel lateral de conta
  // ----------------------------------------------------------------
  "account.title": "A minha conta",
  "account.open": "Abrir painel de conta",
  "account.close": "Fechar painel de conta",
  "account.username": "Username",
  "account.email": "Email",
  "account.userId": "ID de utilizador",
  "account.memberSince": "Membro desde",
  "account.copyId": "Copiar ID",
  "account.copied": "Copiado!",
  "account.logout": "Terminar sessão",
  "account.logoutHint":
    "Termina a sessão neste dispositivo. As tuas apostas ficam guardadas na conta.",
  "account.loadError": "Não foi possível atualizar os dados da conta.",

  // ----------------------------------------------------------------
  // Histórico de apostas (BetsManager desktop + MobileBets)
  // ----------------------------------------------------------------
  "bets.searchPlaceholder": "Pesquisar equipa, mercado ou notas...",
  "bets.countOf": "{shown} de {total} apostas",
  "bets.new": "Registar aposta",
  "bets.empty": "Nenhuma aposta encontrada com os filtros selecionados.",
  "bets.addNew": "Adicionar nova aposta",

  // Seleção múltipla e ações em massa
  "bets.selectMultiple": "Selecionar várias",
  "bets.cancelSelection": "Cancelar seleção",
  "bets.deselectFiltered": "Desmarcar filtradas",
  "bets.selectFiltered": "Selecionar filtradas ({n})",
  "bets.selectedSuffix": { one: "aposta selecionada", other: "apostas selecionadas" },
  "bets.deleteConfirm": { one: "Apagar {n} aposta?", other: "Apagar {n} apostas?" },
  "bets.cancelDeleteAria": "Cancelar eliminação",
  "bets.restore": "Repor",
  "bets.ignore": "Ignorar",
  "bets.duplicate": "Duplicar",

  "bets.bulkEdit.title": {
    one: "Editar {n} aposta — só campos comuns",
    other: "Editar {n} apostas — só campos comuns",
  },
  "bets.bulkEdit.close": "Fechar edição em massa",
  "bets.bulkEdit.hint":
    "Só os campos que alterares são aplicados. O montante, a odd e as seleções de cada aposta ficam intactos.",
  "bets.bulkEdit.sport": "Desporto (vazio = manter)",
  "bets.bulkEdit.keep": "Manter",
  "bets.bulkEdit.keepStatus": "Manter estado",
  "bets.bulkEdit.keepBookmaker": "Manter casa",
  "bets.bulkEdit.keepAccount": "Manter conta",
  "bets.bulkEdit.keepMoney": "Manter tipo",
  "bets.bulkEdit.note": "Acrescentar nota (opcional)",
  "bets.bulkEdit.notePlaceholder": "Fica anexada às notas de cada aposta selecionada",
  "bets.bulkEdit.apply": "Aplicar a {n}",
  "bets.bulkIgnore.title": {
    one: "Ignorar {n} aposta — fora das estatísticas",
    other: "Ignorar {n} apostas — fora das estatísticas",
  },
  "bets.bulkIgnore.close": "Fechar ignorar em massa",
  "bets.bulkIgnore.reason": "Motivo (opcional, aplicado a todas)",
  "bets.bulkIgnore.reasonPlaceholder": "Ex.: apostas de teste, erro de registo…",
  "bets.bulkIgnore.confirm": "Ignorar {n}",

  // Ordenação
  "bets.sort.date": "Data",
  "bets.sort.stake": "Stake",
  "bets.sort.odd": "Odd",
  "bets.sort.profit": "Lucro",
  "bets.sort.potential": "Potencial",
  "bets.sort.aria": "Ordenar por {label}",
  "bets.sort.ariaActive": "Ordenar por {label}, direção {direction}",
  "bets.sort.asc": "ascendente",
  "bets.sort.desc": "descendente",

  // Cartão de aposta
  "bets.cardAriaSelect": "Selecionar aposta de {date}",
  "bets.cardAriaView": "Ver detalhes da aposta de {date}",
  "bets.selectBet": "Selecionar aposta",
  "bets.ignored": "Ignorada",
  "bets.ignoredTitle": "Excluída das estatísticas",
  "bets.deleteQ": "Apagar?",
  "bets.confirmDelete": "Confirmar apagar",
  "bets.ignoreReasonPlaceholder": "Motivo (opcional)",
  "bets.ignoreReasonAria": "Motivo para ignorar a aposta",
  "bets.ignoreTitle": "Ignorar aposta (excluir das estatísticas)",
  "bets.duplicateTitle": "Duplicar aposta",
  "bets.editTitle": "Editar aposta",
  "bets.restoreTitle": "Repor aposta nas estatísticas",
  "bets.deleteTitle": "Apagar aposta",

  // Notas geradas ao duplicar
  "bets.duplicatedNote": "Aposta duplicada.",
  "bets.duplicatedPrefix": "[Duplicado] {notes}",

  // Detalhes da aposta
  "bets.details.title": "Detalhes da aposta",
  "bets.details.close": "Fechar detalhes da aposta",
  "bets.details.bookmaker": "Casa",
  "bets.details.dateTime": "Data e hora",
  "bets.details.origin": "Origem",
  "bets.details.money": "Dinheiro",
  "bets.details.stats": "Estatísticas",
  "bets.details.ignoredValue": "Ignorada (excluída)",
  "bets.details.financial": "Resumo financeiro",
  "bets.details.selections": "Seleções do boletim",
  "bets.details.selectionN": "Seleção {n}",
  "bets.details.noEvent": "Evento indisponível",
  "bets.details.noSelections": "Esta aposta não tem seleções guardadas.",
  "bets.details.notes": "Notas",
  "bets.details.comment": "Comentário",
  "bets.details.tags": "Etiquetas",

  // Campos partilhados (detalhes + formulário)
  "bets.field.stake": "Stake",
  "bets.field.totalOdd": "Odd total",
  "bets.field.potential": "Potencial",
  "bets.field.return": "Retorno",
  "bets.field.netProfit": "Lucro líquido",
  "bets.field.market": "Mercado",
  "bets.field.choice": "Escolha",
  "bets.field.odd": "Odd",
  "bets.field.moneyType": "Tipo de dinheiro",

  // Formulário de registo/edição
  "bets.form.editTitle": "Editar registo de aposta",
  "bets.form.newTitle": "Registar nova aposta",
  "bets.form.type": "Tipo de aposta",
  "bets.form.settleStatus": "Estado de liquidação",
  "bets.form.cashoutValue": "Valor do cashout ({currency})",
  "bets.form.cashoutHint":
    "Montante efetivamente recebido ao fazer cashout (independente do resultado).",
  "bets.form.otherBookmaker": "Outra (escrever...)",
  "bets.form.which": "Qual?",
  "bets.form.whichPlaceholder": "Ex: Betfair, Betclic.fr",
  "bets.form.dateTime": "Data / hora",
  "bets.form.moneyKind": "Tipo de aposta",
  "bets.form.normal": "Normal",
  "bets.form.normalHint": "Stake real",
  "bets.form.freebetHint": "Aposta grátis",
  "bets.form.riskFreeHint": "Stake real, derrota devolvida",
  "bets.form.freebetType": "Tipo de freebet",
  "bets.form.snr": "Stake não devolvida — SNR (ganho = (odd−1)×stake)",
  "bets.form.sr": "Stake devolvida — SR (ganho = odd×stake)",
  "bets.form.freebetDefault":
    "Predefinido pela casa ({bookmaker}). SNR é o padrão; o Betclic usa SR.",
  "bets.form.riskFreeInfo":
    "Aposta sem risco: a stake é dinheiro real e conta para o lucro como uma aposta normal. Se ganhar, o lucro é normal; se perder, perde a stake. Regista a freebet devolvida como uma aposta à parte quando a usares.",
  "bets.form.stake": "Valor da aposta (stake)",
  "bets.form.notes": "Notas adicionais (opcional)",
  "bets.form.notesPlaceholder": "Ex: Segui tipster X, jogo crucial",
  "bets.form.selections": "Seleções do bilhete ({n})",
  "bets.form.addSelection": "Adicionar seleção",
  "bets.form.event": "Evento / jogo",
  "bets.form.eventPlaceholder": "Ex: Benfica vs Porto",
  "bets.form.marketPlaceholder": "Ex: Resultado final, total de golos",
  "bets.form.choiceLabel": "Escolha / prognóstico",
  "bets.form.choicePlaceholder": "Ex: Benfica, mais de 2.5",
  "bets.form.oddIndividual": "Odd individual",
  "bets.form.preview": "Simulação do boletim",
  "bets.form.totalOdd": "Odd total: ",
  "bets.form.potentialReturn": "Retorno potencial",
  "bets.form.settledReturn": "Retorno liquidado",
  "bets.form.settledReturnAria": "Retorno liquidado",
  "bets.form.save": "Guardar alterações",
  "bets.form.submit": "Registar aposta",
  "bets.error.stake": "Por favor insere uma stake válida.",
  "bets.error.bookmaker": "Por favor define a casa de apostas.",
  "bets.error.selections":
    "Por favor preenche todos os campos das seleções com valores válidos (odds devem ser maiores que 1.0).",

  // ---- Específicos do ecrã mobile ----
  "bets.searchShort": "Pesquisar…",
  "bets.selectAria": "Selecionar apostas",
  "bets.day.today": "Hoje",
  "bets.day.yesterday": "Ontem",
  "bets.selectedShort": "sel.",
  "bets.emptyNoBets": "Ainda não registaste apostas.",
  "bets.emptyFiltered": "Nenhuma aposta corresponde aos filtros.",
  "bets.detailFallbackTitle": "Aposta",
  "bets.potentialShort": "Retorno pot.",
  "bets.detailAccount": "Conta {label}",
  "bets.detailIgnoredLine": "Ignorada — excluída das estatísticas",
  "bets.bulk.editAria": "Editar selecionadas",
  "bets.bulk.restoreAria": "Repor selecionadas",
  "bets.bulk.ignoreAria": "Ignorar selecionadas",
  "bets.bulk.duplicateAria": "Duplicar selecionadas",
  "bets.bulk.deleteAria": "Apagar selecionadas",

  "bets.ignoreSheet.title": "Ignorar aposta?",
  "bets.ignoreSheet.desc":
    "A aposta em {event} deixa de contar para as estatísticas e gráficos. Continua na lista e podes repô-la quando quiseres.",
  "bets.ignoreSheet.reasonPlaceholder": "Ex.: aposta de teste, erro de registo…",
  "bets.deleteSheet.title": "Apagar aposta?",
  "bets.deleteSheet.desc": "A aposta em {event} será apagada definitivamente.",
  "bets.bulkDelete.title": "Apagar {n} apostas?",
  "bets.bulkDelete.desc": "As {n} apostas selecionadas serão apagadas definitivamente.",
  "bets.bulkDelete.confirm": "Apagar {n}",
  "bets.bulkIgnore.sheetTitle": "Ignorar {n} apostas?",
  "bets.bulkIgnore.desc":
    "As selecionadas deixam de contar para as estatísticas e gráficos. Continuam na lista e podes repô-las quando quiseres.",
  "bets.bulkEdit.sheetTitle": "Editar {n} apostas",
  "bets.bulkEdit.applyN": { one: "Aplicar a {n} aposta", other: "Aplicar a {n} apostas" },
  "bets.bulkEdit.pickField": "Escolhe pelo menos um campo para alterar",
  "bets.filtersSheet.title": "Filtros e ordenação",
  "bets.sortBy": "Ordenar por",
  "bets.direction": "Direção",
  "bets.directionDesc": "Descendente",
  "bets.directionAsc": "Ascendente",

  "bets.form.cashoutReceived": "Valor recebido no cashout",
  "bets.form.settledOptional": "Retorno liquidado (opcional)",
  "bets.form.automatic": "Automático",
  "bets.form.bookmakerName": "Nome da casa",
  "bets.form.bookmakerNamePlaceholder": "Ex.: Bwin",
  "bets.form.accountOptional": "Conta (opcional)",
  "bets.form.selectionsShort": "Seleções",
  "bets.form.removeSelection": "Remover seleção",
  "bets.form.eventPlaceholderShort": "Evento (ex.: Benfica vs Porto)",
  "bets.form.choicePlaceholderShort": "Escolha",
  "bets.form.stakeCurrency": "Stake ({currency})",
  "bets.form.snrShort": "SNR (stake não devolvida)",
  "bets.form.srShort": "SR (stake devolvida)",
  "bets.form.notesOptional": "Notas (opcional)",
  "bets.form.notesPlaceholderShort": "Apontamentos sobre a aposta…",

  "bets.toast.updated": "Aposta atualizada",
  "bets.toast.added": "Aposta registada",
  "bets.toast.duplicated": "Aposta duplicada",
  "bets.toast.ignored": "Aposta ignorada — fora das estatísticas",
  "bets.toast.restored": "Aposta reposta nas estatísticas",
  "bets.toast.deleted": "Aposta apagada",
  "bets.toast.bulkUpdated": { one: "{n} aposta atualizada", other: "{n} apostas atualizadas" },
  "bets.toast.bulkIgnored": { one: "{n} aposta ignorada", other: "{n} apostas ignoradas" },
  "bets.toast.bulkRestored": { one: "{n} aposta reposta", other: "{n} apostas repostas" },
  "bets.toast.bulkDuplicated": { one: "{n} aposta duplicada", other: "{n} apostas duplicadas" },
  "bets.toast.bulkDeleted": { one: "{n} aposta apagada", other: "{n} apostas apagadas" },

  // ----------------------------------------------------------------
  // Painel (Dashboard desktop + MobileDashboard)
  // ----------------------------------------------------------------
  "dashboard.betsOf": "{shown} de {total} apostas",
  "dashboard.empty": "Sem apostas para os filtros escolhidos.",
  "dashboard.noRecords": "Sem registos.",
  "dashboard.viewBets": { one: "Ver {n} aposta", other: "Ver {n} apostas" },

  // Cartões KPI
  "dashboard.netProfit": "Lucro líquido",
  "dashboard.return": "Retorno",
  "dashboard.roi": "ROI / Yield",
  "dashboard.volume": "Volume",
  "dashboard.totalVolume": "Volume total",
  "dashboard.efficiency": "Eficiência",
  "dashboard.winRate": "Taxa de acerto",
  "dashboard.totalBets": "Total de apostas",
  "dashboard.registered": "registadas",
  "dashboard.active": "Ativas",
  "dashboard.statWon": "{n} ganhas",
  "dashboard.statResolved": "{n} resolvidas",
  "dashboard.statPending": "{n} pendentes",

  // Gráfico de evolução
  "dashboard.evolution.title": "Evolução do lucro líquido",
  "dashboard.evolution.desc": "Evolução acumulada ao longo das apostas resolvidas",
  "dashboard.cumulativeProfit": "Lucro acumulado",
  "dashboard.profit": "Lucro",
  "dashboard.evolution.tooltip": "Aposta #{index} ({date}) - {event}",

  // Distribuição de resultados
  "dashboard.statusDistribution.title": "Distribuição de resultados",
  "dashboard.statusDistribution.desc": "Percentagem por estado de aposta",
  "dashboard.resolved": "Resolvidas",
  "dashboard.resolvedDrill": "Ver apostas resolvidas no histórico",
  "dashboard.viewBetsFor": "Ver apostas: {name}",
  "dashboard.betsTooltip": "{n} apostas",
  "dashboard.noResults": "Nenhum resultado registado ainda.",

  // Desempenho mensal
  "dashboard.monthly.title": "Desempenho mensal",
  "dashboard.monthly.desc": "Lucro líquido dentro do período selecionado",
  "dashboard.monthly.tooltip": "{month}: {bets} apostas | Volume: {volume}",
  "dashboard.monthlyProfit": "Lucro por mês",

  // Desempenho por casa
  "dashboard.bookmakers.title": "Desempenho por casa de apostas",
  "dashboard.bookmakers.titleShort": "Desempenho por casa",
  "dashboard.bookmakers.desc": "Análise de rentabilidade e volume por operador",
  "dashboard.bookmakers.subtitle": "{n} apostas · Volume {volume}",
  "dashboard.table.operator": "Operador",
  "dashboard.table.bets": "Apostas",

  // Análise de freebets
  "dashboard.freebets.title": "Análise de freebets",
  "dashboard.freebets.desc": "Estatísticas de desempenho das apostas com freebet",
  "dashboard.freebets.count": "Freebets registadas",
  "dashboard.freebets.invested": "Total investido (freebet)",
  "dashboard.freebets.profit": "Lucro líquido gerado",
  "dashboard.freebets.winRate": "Taxa de acerto (freebets)",
  "dashboard.freebets.resolvedRatio": "Resolvidas / total",
  "dashboard.freebets.ofTotal": "{resolved} de {total}",

  // Insights
  "dashboard.insights.title": "Insights",
  "dashboard.insights.bestBookmaker": "Operador mais rentável",
  "dashboard.insights.bestBookmakerHint": "Onde fazes mais dinheiro",
  "dashboard.insights.notEnoughData": "Sem dados suficientes",
  "dashboard.insights.avgOdd": "Odd média das apostas ganhas",
  "dashboard.insights.avgOddShort": "Odd média das ganhas",
  "dashboard.insights.avgOddHint": "Nível médio de risco vitorioso",
  "dashboard.insights.biggestWin": "Maior lucro individual",
  "dashboard.insights.biggestWinHint": "O teu boletim de maior sucesso",
  "dashboard.insights.noWin": "Nenhum prémio ganho.",

  // ----------------------------------------------------------------
  // Configurações — preferências gerais
  // ----------------------------------------------------------------
  "settings.general.title": "Preferências gerais",
  "settings.save": "Guardar preferências",
  "settings.saved": "Preferências guardadas",
  "settings.errors.invalidStake": "Stake padrão inválida.",

  "settings.currency.label": "Moeda",
  "settings.currency.aria": "Selecionar moeda",
  "settings.currency.eur": "Euro (€)",
  "settings.currency.usd": "Dólar ($)",
  "settings.currency.gbp": "Libra (£)",
  "settings.currency.brl": "Real (R$)",

  "settings.defaultBookmaker.label": "Casa de apostas padrão",
  "settings.defaultStake.label": "Stake padrão ({currency})",

  // ----------------------------------------------------------------
  // Configurações — aparência (tema + idioma)
  // ----------------------------------------------------------------
  "settings.appearance.title": "Aparência",
  "settings.theme.label": "Tema",
  "settings.theme.aria": "Selecionar tema",
  "theme.light": "Claro",
  "theme.dark": "Escuro",
  "theme.system": "Sistema",

  "settings.language.title": "Idioma",
  "settings.language.desc": "Escolhe o idioma da aplicação.",
  // Nomes de idioma ficam sempre na própria língua (convenção dos seletores
  // de idioma): quem não percebe a língua atual reconhece na mesma a sua.
  "lang.pt": "Português",
  "lang.en": "English",

  // ----------------------------------------------------------------
  // Configurações — casas de apostas ativas
  // ----------------------------------------------------------------
  "settings.bookmakers.title": "Casas de apostas",
  "settings.bookmakers.desc":
    "Escolhe as casas que usas. Só as selecionadas aparecem — e são importadas — no site e na extensão de browser.",
  "settings.bookmakers.none":
    "Nenhuma casa selecionada — não vais conseguir importar apostas até escolheres pelo menos uma.",
  "settings.bookmakers.loadError": "Erro ao obter as casas ativas.",
  "settings.bookmakers.saveError": "Erro ao guardar as casas ativas.",

  // ----------------------------------------------------------------
  // Configurações — contas por casa de apostas
  // ----------------------------------------------------------------
  "settings.management.title": "Gestão",
  "settings.accounts.title": "Contas por casa de apostas",
  "settings.accounts.desc":
    "Regista as tuas contas em cada casa (podes ter várias na mesma casa). Depois associa apostas a cada conta e filtra o painel e a lista por conta.",
  "settings.accounts.count": { one: "{n} conta", other: "{n} contas" },
  "settings.accounts.betCount": {
    one: "1 aposta associada",
    other: "{n} apostas associadas",
  },
  "settings.accounts.new": "Nova conta",
  "settings.accounts.add": "Adicionar conta",
  "settings.accounts.addShort": "Adicionar",
  "settings.accounts.added": "Conta adicionada",
  "settings.accounts.updated": "Conta atualizada",
  "settings.accounts.deleted": "Conta apagada",
  "settings.accounts.empty": "Ainda não tens contas registadas.",
  "settings.accounts.emptyLong":
    "Ainda não tens contas registadas. As apostas sem conta continuam a funcionar normalmente.",
  "settings.accounts.nameRequired": "Dá um nome à conta.",
  "settings.accounts.namePlaceholder": "Nome da conta",
  "settings.accounts.labelPlaceholder": "Etiqueta (ex.: Conta principal)",
  "settings.accounts.labelPlaceholderLong": "Nome da conta (ex.: Conta principal)",
  "settings.accounts.usernamePlaceholder": "Username na casa (opcional)",
  "settings.accounts.usernamePlaceholderShort": "Username (opcional)",
  "settings.accounts.usernameHint":
    "O username com que inicias sessão na casa. A extensão usa-o para encaminhar as apostas importadas.",
  "settings.accounts.usernameHintLong":
    "O username com que inicias sessão na casa. A extensão usa-o para encaminhar as apostas importadas para esta conta.",
  "settings.accounts.usernameAria": "Username na casa",
  "settings.accounts.bookmakerAria": "Casa de apostas",
  "settings.accounts.renameTitle": "Renomear “{label}”",
  "settings.accounts.rename": "Renomear conta",
  "settings.accounts.renameAria": "Renomear {label}",
  "settings.accounts.deleteTitle": "Apagar conta",
  "settings.accounts.deleteAria": "Apagar {label}",
  "settings.accounts.deleteConfirm": "Apagar?",
  "settings.accounts.deleteConfirmWithBets":
    "As {n} apostas ficam sem conta. Apagar?",
  "settings.accounts.deleteHint":
    "Apagar uma conta não apaga as apostas — ficam apenas \"sem conta\", associadas à casa.",

  // ----------------------------------------------------------------
  // Configurações — registo de alterações (auditoria)
  // ----------------------------------------------------------------
  "settings.audit.title": "Registo de alterações",
  "settings.audit.desc": "Registo detalhado de operações efetuadas nesta sessão",
  "settings.audit.count": {
    one: "{n} registo nesta sessão",
    other: "{n} registos nesta sessão",
  },
  "settings.audit.empty": "Sem alterações nesta sessão.",

  // ----------------------------------------------------------------
  // Configurações — dados (exportar / importar)
  // ----------------------------------------------------------------
  "settings.data.title": "Dados",
  "settings.data.cardTitle": "Cópia de segurança, importar e exportar",
  "settings.data.desc":
    "Mantém os teus dados de apostas seguros. Descarrega backups completos em formato JSON ou exporta as tuas apostas para análise externa em folhas de cálculo Excel/CSV.",

  "settings.export.title": "Exportar ficheiros",
  "settings.export.desc": "Exporta tabelas estruturadas compatíveis ou cópias completas.",
  "settings.export.csv.title": "Exportar CSV",
  "settings.export.csv.desc": "Todas as apostas em formato CSV",
  "settings.export.csvButton": "Descarregar CSV (.csv)",
  "settings.export.backup.title": "Backup completo (JSON)",
  "settings.export.backup.desc": "Apostas + preferências",
  "settings.export.backupButton": "Descarregar backup JSON",
  "settings.export.empty": "Sem apostas para exportar",
  "settings.export.emptyToast": "Não há apostas para exportar.",

  "settings.import.title": "Importar ficheiro",
  "settings.import.desc": "Backup JSON ou CSV",
  "settings.import.cardTitle": "Restaurar / importar",
  "settings.import.cardDesc":
    "Sincroniza e restaura backups antigos arrastando o teu ficheiro.",
  "settings.import.choose": "Escolher ficheiro (.json, .csv)",

  // ----------------------------------------------------------------
  // Configurações — zona perigosa
  // ----------------------------------------------------------------
  "settings.danger.title": "Zona perigosa",

  "settings.demo.title": "Repor dados de demonstração",
  "settings.demo.desc": "Substitui tudo pelos dados de exemplo",
  "settings.demo.button": "Carregar dados de demonstração",
  "settings.demo.confirmTitle": "Repor dados de demonstração?",
  "settings.demo.confirmDesc":
    "As tuas apostas atuais serão substituídas pelos dados de exemplo. Esta ação não pode ser desfeita.",
  "settings.demo.sure": "Substituir dados atuais?",
  "settings.demo.confirm": "Repor",
  "settings.demo.yes": "Sim, repor demonstração",
  "settings.demo.done": "Dados de demonstração repostos",

  "settings.clear.title": "Apagar todos os dados",
  "settings.clear.desc": "Remove todas as apostas da base de dados",
  "settings.clear.button": "Limpar todos os dados",
  "settings.clear.confirmTitle": "Apagar todos os dados?",
  "settings.clear.confirmDesc":
    "Todas as apostas serão removidas permanentemente da base de dados. Considera exportar um backup primeiro.",
  "settings.clear.sure": "Tens a certeza absoluta?",
  "settings.clear.confirm": "Apagar tudo",
  "settings.clear.yes": "Sim, apagar tudo",
  "settings.clear.done": "Dados apagados",

  // ----------------------------------------------------------------
  // Configurações — sobre / atualizações
  // ----------------------------------------------------------------
  "settings.about.title": "Sobre",
  "settings.about.version": "Versão do frontend",
  "settings.about.checking": "A verificar…",
  "settings.about.checkUpdate": "Verificar atualização",
  "settings.about.checkUpdateDesc": "Procura um bundle novo no servidor",
  "settings.about.checkDone":
    "Verificação concluída — aplica no próximo arranque se houver novidade.",
} satisfies Record<string, Entry>;

export type TKey = keyof typeof PT;
