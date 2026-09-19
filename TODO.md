# Por fazer

Só o que falta. O que já foi feito vive no histórico do git (os itens feitos
até 19/09/2026 estão no TODO.md do commit 72030b2).

**CLV (odd de fecho)**
- [ ] Um mercado exclusivo a que a página cortou as saídas menos prováveis soma
      abaixo do que devia, e aí a margem parece menor e o CLV sai otimista. Só
      uma verificação estrutural (o nó do mercado diz quantas saídas tem) resolve.

**Apostas (modelo de dados)**
- [ ] Cashout parcial: parte do boletim é fechada e o resto continua a correr.
      A v1 ficou de propósito só com o cashout TOTAL, e hoje um parcial só
      cabe no modelo mentindo numa das metades. Precisa de guardar o
      valor já fechado E a stake que ficou viva, e de decidir o que a taxa de
      acerto faz com meia aposta ainda por liquidar.
- [ ] Marcar a aposta como AO VIVO ou PRÉ-JOGO. Dá-se derivar do que já se
      guarda (`Bet.dateTime` contra `Selection.startsAtUtc`), sem migração e sem
      perguntar nada a quem aposta. Não é cosmético: o CLV de uma aposta ao vivo
      não quer dizer nada - a linha de fecho é de antes do apito e a aposta é de
      depois. Enquanto as duas se misturam, as médias do painel estão a ser
      envenenadas por apostas que nunca lá deviam estar. Ficam de fora do CLV
      como já ficam as promocionais, e contam-se à parte.

**Painel e análise**
- [ ] Unidades. Hoje a stake só existe em euros (`Bet.stake`) - não há unidade em
      lado nenhum. Defini-la nas preferências (fixa, ou % do saldo da banca) e
      mostrar cada aposta em `u`. O que isto desbloqueia não é a etiqueta, é a
      métrica: stake média nas PERDIDAS contra stake média nas GANHAS. Quem
      perde a 1.8u e ganha a 0.9u está a perseguir prejuízo, e isso prova-se com
      o que já está gravado.
- [ ] Esperado contra real. O `moneyClv` que o `src/lib/clv.ts` já calcula É o
      valor esperado da aposta - só que ninguém o desenha. Um gráfico com o
      lucro esperado acumulado por cima do lucro real acumulado: a distância
      entre as duas linhas é a variância, e é a resposta a "tive azar ou sou
      mau". A juntar: se o yield de agora se distingue de zero para o número de
      apostas que existe.
- [ ] Etiquetas a sério. O campo `tags` existe no `Bet`, viaja no CSV... e não é
      editável (ver o comentário no `BetsManager.tsx`). Passar a lista, editável
      no formulário, a sugerir as já usadas, com filtro no painel e no histórico
      e uma tabela de lucro + CLV por etiqueta. É o que separa um livro de
      contas de um diário: "ao vivo", "tilt", "modelo", "dica do X".

**Ferramentas**
- [ ] Separador de calculadoras: no-vig/margem, Kelly, hedge, arbitragem,
      múltipla, conversor de odds e conversor de freebet. A matemática já existe
      toda na app - o de-vig no `lib/betclicOdds.ts`, o Kelly na avaliação de
      apostas da IA - só que está enterrada dentro de funcionalidades. Além de
      servir quem já paga, é a porta de entrada da categoria: é por páginas
      destas que se chega ao Betstamp e ao OddsJam.

**Notificações**
- [ ] Notificações push para quem usa a app. A infraestrutura já existe desde
      13/09 (`lib/push.ts`, `src/lib/push.ts`, FCM), mas só serve o alerta de bot
      parado. Os momentos que passam todos despercebidos: a aposta liquidou, a
      odd de fecho foi capturada (o veredito do CLV chega horas depois de se
      apostar e ninguém volta à app para o ver), a dica do dia está pronta, a
      banca bateu um marco. Numa subscrição mensal, é o que faz a pessoa voltar.

**Social**
- [ ] Classificação por CLV verificado. O social hoje é pedir amizade e ver as
      apostas de um amigo. Uma tabela ordenada por CLV e yield mede PROCESSO e
      não sorte, e - por as apostas virem da extensão com `metadata.ref` - pode
      ser verificada, que é precisamente o que um tipster não consegue fazer.
- [ ] Classificação por lucro, dentro da app. A par da de CLV, mas a dizer outra
      coisa: o CLV ordena por quem aposta bem, o lucro ordena por quem está à
      frente. Decidir se é em dinheiro ou em unidades (dinheiro premeia quem tem
      banca maior) e se entra toda a gente ou só os amigos.
