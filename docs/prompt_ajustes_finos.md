# ✨ PROMPT AJUSTES FINOS - Polimento Final
## Next Level Academia - Melhorias de UX e Profissionalismo

---

## 🎯 OBJETIVO

Implementar 3 ajustes finos para deixar o app **perfeito e pronto para entrega profissional**.

---

## 📋 AJUSTE 1: Splash Screen (Tela de Instalação)

### **Problema Atual**
- Bordas escuras nos lados
- Botões cortados na base
- Não ocupa espaço ideal

### **Solução**

**Tamanho Correto:**
- Largura: 100% (sem bordas)
- Altura: Ajustada para mostrar todos os botões
- Sem espaço vazio lateral

**Implementação:**
```
1. Remover bordas escuras (CSS/Tailwind)
2. Expandir janela para 100% da largura
3. Ajustar altura para mostrar botões completos
4. Testar em Windows e Mac
```

**Resultado:**
- ✅ Splash screen sem bordas
- ✅ Botões visíveis e clicáveis
- ✅ Layout profissional

---

## 📋 AJUSTE 2: Sistema de Notificações Profissional

### **Problema Atual**
- Notificações desorganizadas
- Sem priorização
- Linguagem técnica

### **Solução: Notificações por Prioridade**

**Estrutura:**

```
┌─────────────────────────────────────────────────────┐
│ 🔔 NOTIFICAÇÕES                                     │
├─────────────────────────────────────────────────────┤
│                                                     │
│ 🔴 PRIORITÁRIAS (Clicáveis)                        │
│ ├─ 👤 João Silva - Mensalidade em Atraso           │
│ │  "Mensalidade de Abril ainda não foi paga"       │
│ │  [Clique para ver detalhes]                       │
│ │                                                   │
│ ├─ 👤 Maria Santos - Mensalidade em Atraso         │
│ │  "Mensalidade de Maio ainda não foi paga"        │
│ │  [Clique para ver detalhes]                       │
│ │                                                   │
│ └─ ✅ Nova Matrícula - Pedro Costa                 │
│    "Bem-vindo! Obrigado por se inscrever"          │
│    [Clique para ver detalhes]                       │
│                                                     │
│ 📊 RELATÓRIOS (Informativos)                       │
│ ├─ 📈 Receita de Abril: €1.250                     │
│ └─ 📉 Taxa de Cobrança: 92%                        │
│                                                     │
│ ℹ️ APP (Menos Importantes)                         │
│ ├─ Backup realizado com sucesso                    │
│ └─ Atualização disponível                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Categorias:**

**1. NOTIFICAÇÕES PRIORITÁRIAS (Vermelho/Laranja)**
```
Tipos:
- Mensalidade em Atraso (em vez de "divida")
- Mensalidade Vencendo (próximos 3 dias)
- Nova Matrícula
- Cancelamento de Matrícula

Linguagem Profissional:
❌ "Aluno com dívida"
✅ "Mensalidade em Atraso"

❌ "Novo aluno"
✅ "Nova Matrícula - [Nome]"

Ação ao Clicar:
- Abre pop-up com dados do aluno
- Mostra histórico de pagamentos
- Opções: Enviar Notificação, Adicionar Nota, Registar Pagamento
```

**2. NOTIFICAÇÕES DE RELATÓRIOS (Azul)**
```
Tipos:
- Receita do Mês
- Taxa de Cobrança
- Alunos Novos (resumo)
- Alunos Inativos

Linguagem Profissional:
✅ "Receita de Abril: €1.250"
✅ "Taxa de Cobrança: 92%"
✅ "5 Novas Matrículas este Mês"

Não Clicáveis (apenas informativos)
```

**3. NOTIFICAÇÕES DO APP (Cinzento)**
```
Tipos:
- Backup realizado
- Atualização disponível
- Configuração concluída
- Exportação realizada

Menos Importantes
Não Clicáveis
```

---

### **Implementação**

**Pop-up ao Clicar em Notificação Prioritária:**

```
┌─────────────────────────────────────────────────────┐
│ 👤 João Silva - Mensalidade em Atraso              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Dados do Aluno:                                     │
│ - Nome: João Silva                                  │
│ - Email: joao@email.com                             │
│ - Telefone: 923 456 789                             │
│ - Plano: Premium                                    │
│                                                     │
│ Histórico de Pagamentos:                            │
│ - Março: ✓ Pago (€50)                              │
│ - Abril: ✗ Não Pago (€50)                          │
│ - Maio: ✗ Não Pago (€50)                           │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Ações:                                              │
│ [Enviar Mensagem] [Adicionar Nota] [Registar Pgto] │
│                                                     │
│ Mensagem Predefinida:                               │
│ "Olá João, notamos que sua mensalidade de Abril    │
│  ainda não foi paga. Pode confirmar se há algum    │
│  problema? Estamos aqui para ajudar!"              │
│                                                     │
│ [Enviar via WhatsApp] [Enviar Email] [Cancelar]   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 📋 AJUSTE 3: Sistema de Pagamentos Profissional

### **Problema Atual**
- Interface básica
- Sem contexto visual
- Sem confirmação clara

### **Solução: Pagamento Profissional**

**Tela de Registar Pagamento (Melhorada):**

```
┌─────────────────────────────────────────────────────┐
│ 💳 Registar Pagamento                              │
├─────────────────────────────────────────────────────┤
│                                                     │
│ Aluno: João Silva                                   │
│ Plano: Premium (€50/mês)                            │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Mês de Referência:                                  │
│ [Abril ▼]                                           │
│                                                     │
│ Valor: €50                                          │
│ [Editar]                                            │
│                                                     │
│ Método de Pagamento:                                │
│ [Dinheiro ▼]  [Cartão ▼]  [Transferência ▼]       │
│                                                     │
│ Data de Pagamento:                                  │
│ [30/04/2026]                                        │
│                                                     │
│ Notas (Opcional):                                   │
│ [Pagamento em atraso - cliente contactado]         │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Resumo:                                             │
│ ✓ Aluno: João Silva                                │
│ ✓ Valor: €50                                        │
│ ✓ Mês: Abril                                        │
│ ✓ Método: Dinheiro                                  │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ [Cancelar] [Registar Pagamento]                    │
│                                                     │
│ ☐ Enviar Recibo via WhatsApp                       │
│ ☐ Enviar Recibo via Email                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Funcionalidades:**

1. **Contexto Visual:**
   - Nome do aluno em destaque
   - Plano e valor padrão
   - Histórico de pagamentos do mês

2. **Validação:**
   - Valor não pode ser negativo
   - Data não pode ser futura
   - Método de pagamento obrigatório

3. **Confirmação:**
   - Resumo antes de confirmar
   - Opção de enviar recibo
   - Mensagem de sucesso clara

4. **Após Pagamento:**
   ```
   ┌─────────────────────────────────────────────────┐
   │ ✓ Pagamento Registado com Sucesso!             │
   │                                                 │
   │ João Silva - Abril - €50                        │
   │ Data: 30/04/2026                                │
   │ Método: Dinheiro                                │
   │                                                 │
   │ [Fechar] [Enviar Recibo]                       │
   │                                                 │
   └─────────────────────────────────────────────────┘
   ```

---

## 📋 AJUSTE 4: Mensagem de Boas-vindas na Matrícula

### **Problema Atual**
- Sem confirmação de inscrição
- Sem contacto automático

### **Solução**

**Após Nova Matrícula:**

```
┌─────────────────────────────────────────────────────┐
│ ✅ Nova Matrícula Registada!                       │
│                                                     │
│ Pedro Costa                                         │
│ Plano: Premium                                      │
│ Data de Inscrição: 30/04/2026                       │
│                                                     │
│ ─────────────────────────────────────────────────   │
│                                                     │
│ Enviar Mensagem de Boas-vindas?                    │
│                                                     │
│ Mensagem Predefinida:                               │
│ "Olá Pedro! 🎉                                      │
│                                                     │
│  Bem-vindo à [Nome da Academia]!                   │
│                                                     │
│  Estamos felizes por te ter connosco.              │
│  Seu plano Premium está ativo e pronto para usar.  │
│                                                     │
│  Se tiver dúvidas, estamos aqui para ajudar!       │
│                                                     │
│  Abraços,                                           │
│  Equipa da [Nome da Academia]"                     │
│                                                     │
│ [Editar Mensagem]                                   │
│                                                     │
│ [Enviar via WhatsApp] [Enviar Email] [Pular]      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Personalização:**
- Mensagem predefinida (editável)
- Nome da academia automático
- Enviar via WhatsApp ou Email

---

## ✅ CHECKLIST DE IMPLEMENTAÇÃO

**Splash Screen:**
- [ ] Remover bordas escuras
- [ ] Expandir para 100% de largura
- [ ] Ajustar altura para botões visíveis
- [ ] Testar em Windows e Mac

**Notificações:**
- [ ] Criar 3 categorias (Prioritárias, Relatórios, App)
- [ ] Usar linguagem profissional
- [ ] Implementar pop-ups clicáveis
- [ ] Adicionar ações (Mensagem, Nota, Pagamento)
- [ ] Testar com dados reais

**Pagamentos:**
- [ ] Melhorar interface
- [ ] Adicionar contexto visual
- [ ] Implementar resumo
- [ ] Adicionar opção de enviar recibo
- [ ] Testar fluxo completo

**Matrícula:**
- [ ] Adicionar mensagem de boas-vindas
- [ ] Permitir editar mensagem
- [ ] Enviar via WhatsApp/Email
- [ ] Testar com novos alunos

---

## 🔧 INSTRUÇÕES PARA O ANTIGRAVITY

> "Por favor, implementa os seguintes ajustes finos:
>
> **1. SPLASH SCREEN**
> - Remover bordas escuras nos lados
> - Expandir para 100% de largura
> - Ajustar altura para mostrar botões completos
> - Testar em Windows e Mac
>
> **2. NOTIFICAÇÕES PROFISSIONAIS**
> - Criar 3 categorias: Prioritárias (vermelho), Relatórios (azul), App (cinzento)
> - Notificações Prioritárias: Mensalidade em Atraso, Nova Matrícula, Cancelamento
> - Usar linguagem profissional (não 'dívida', usar 'Mensalidade em Atraso')
> - Implementar pop-ups clicáveis com dados do aluno
> - Ações: Enviar Mensagem, Adicionar Nota, Registar Pagamento
> - Notificações de Relatórios: Receita, Taxa de Cobrança, Resumo
> - Notificações do App: Backup, Atualização, etc.
>
> **3. SISTEMA DE PAGAMENTOS PROFISSIONAL**
> - Melhorar interface com contexto visual
> - Mostrar nome do aluno, plano, valor padrão
> - Adicionar resumo antes de confirmar
> - Implementar validação (valor > 0, data não futura)
> - Adicionar opção de enviar recibo
> - Mensagem de sucesso clara
>
> **4. MENSAGEM DE BOAS-VINDAS NA MATRÍCULA**
> - Após nova matrícula, mostrar pop-up
> - Mensagem predefinida (editável)
> - Nome da academia automático
> - Enviar via WhatsApp ou Email
> - Permitir pular
>
> Foca em deixar o app **polido e profissional**."

---

## 📊 RESULTADO ESPERADO

Após implementar:

✅ Splash screen perfeito (sem bordas, botões visíveis)
✅ Notificações organizadas e profissionais
✅ Sistema de pagamentos elegante
✅ Mensagens de boas-vindas automáticas
✅ App pronto para entrega final

---

**Quando terminar, volta aqui!** 🎯
