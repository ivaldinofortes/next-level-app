# Next Level V2

## Problema central resolvido

A V1 misturava dois conceitos:

- cobranca por mes calendario
- cobranca por ciclo real do aluno

Para uma academia, isso gera injustica e confusao. Um aluno que paga no dia 7 nao deve aparecer como devedor no dia 1 do mes seguinte se ainda esta dentro de um mes valido de treino.

## Regra de negocio da V2

Cada pagamento cobre 1 mes real de treino para aquele aluno.

- Se o aluno pagar hoje e estiver em atraso, o novo ciclo passa a contar de hoje.
- Se o aluno pagar antes de vencer, o novo ciclo so comeca depois que o ciclo atual termina.
- O campo `vencimento` passa a representar a **proxima cobranca real** do aluno.
- Cada pagamento guarda o intervalo que cobriu:
  - `referencia_inicio`
  - `referencia_fim`

## Como o sistema deve se comportar

### Cadastro

- Ao matricular sem pagamento, a primeira cobranca nasce na data da matricula.
- Ao matricular com pagamento, o sistema cria o primeiro ciclo automaticamente e define a proxima cobranca.

### Cobranca

- O admin nunca precisa "adivinhar" quem deve.
- O sistema mostra:
  - quem esta coberto
  - quem vence hoje
  - quem esta perto de vencer
  - quem esta em atraso

### Pagamentos

- Ao registrar um pagamento, o sistema recalcula a cobertura automaticamente.
- O historico precisa mostrar nao so o valor, mas o periodo coberto por cada pagamento.

### Relatorios

- O relatorio mensal deve responder duas perguntas diferentes:
  - quanto entrou em caixa no periodo
  - quem esta em cobranca neste momento

Nao se deve usar somente `mes_referencia` para decidir inadimplencia.

## Visao ideal do produto

O dono da academia deveria abrir o sistema e, em menos de 30 segundos, entender:

- quanto recebeu este mes
- quantos alunos estao cobertos
- quantos alunos precisam ser cobrados hoje
- quanto cada aluno ja pagou no periodo
- qual sera a previsao de entrada se todos os atrasados regularizarem

## Proximas melhorias recomendadas

1. Separar o `App.tsx` em modulos:
   - dashboard
   - alunos
   - financas
   - perfil
   - configuracoes
2. Criar uma tabela de `faturas/cobrancas` para controlar aberto, pago, atrasado e perdoado.
3. Adicionar filtros rapidos:
   - vence hoje
   - 3 dias
   - 7 dias
   - atrasados
4. Criar dashboard grafico com:
   - receita por dia
   - receita por modalidade
   - top alunos por pagamento no periodo
5. Adicionar auditoria real:
   - quem editou aluno
   - quem alterou cobranca
   - quem apagou pagamento
6. Mover login fixo para utilizadores reais com perfis:
   - admin
   - recepcao
   - consulta
