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
