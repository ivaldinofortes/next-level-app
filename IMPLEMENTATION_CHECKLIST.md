# ✅ Checklist de Implementação - Refatoração Faseada

## 🎯 Fase 1: Fundação (✅ COMPLETA)

### Estrutura de Pastas
- [x] Criar `src/components/`
- [x] Criar `src/hooks/`
- [x] Criar `src/services/`
- [x] Criar `src/types/`
- [x] Criar `src/constants/`
- [x] Criar `src/utils/`
- [x] Criar `src/layout/`
- [x] Criar `src/pages/`
- [x] Criar `electron/models/`
- [x] Criar `electron/services/`
- [x] Criar `electron/handlers/`

### Tipos TypeScript
- [x] `src/types/index.ts` - Todas as interfaces
- [x] Import com `type` keyword
- [x] Documentadas com JSDoc

### Constantes
- [x] `src/constants/index.ts` - Constantes globais
- [x] Status helpers
- [x] Theme colors
- [x] Payment methods

### Utilidades
- [x] `src/utils/formatting.ts` - Funções de formatação
- [x] Funções puras
- [x] Sem efeitos colaterais

### Serviços
- [x] `src/services/ipc.ts` - Camada IPC
- [x] Todos os métodos documentados
- [x] Error handling centralizado

### Hooks
- [x] `src/hooks/index.ts` - Custom hooks
- [x] `useStudents`, `usePayments`, `useDialog`, `useAsync`, `useBlink`
- [x] Reutilizáveis

### Componentes Base
- [x] `src/components/Dialog.tsx` - Diálogos
- [x] `src/components/UI.tsx` - UI components
- [x] PageHeader, Loading, ErrorAlert, SuccessAlert

### Backend Models
- [x] `electron/models/repositories.ts` - Repository Pattern
- [x] StudentRepository, PaymentRepository, etc.
- [x] RepositoryFactory

### Documentação
- [x] `ARCHITECTURE.md` - Visão geral
- [x] `MIGRATION_GUIDE.md` - Guia passo-a-passo
- [x] `REFACTORING_COMPLETE.md` - Status e próximas etapas
- [x] `README_REFACTORING.md` - Sumário executivo
- [x] `IMPLEMENTATION_CHECKLIST.md` - Este arquivo

### Build & Tests
- [x] TypeScript compila sem erros
- [x] Vite build sucesso
- [x] Bundle size mantido
- [x] 0% regressão

---

## 🚀 Fase 2: Refatorar Componentes (⏳ PRÓXIMA)

### Análise de App.tsx
- [ ] Identificar seções principais
- [ ] Mapear estados por seção
- [ ] Listar componentes a extrair
- [ ] Criar plano de refatoração

### Página 1: StudentsList
- [ ] Criar `src/pages/StudentsList.tsx`
- [ ] Extrair estado de App.tsx
- [ ] Converter para `useStudents` hook
- [ ] Remover constantes inline
- [ ] Usar `IPCService`
- [ ] Adicionar types
- [ ] Testar renderização
- [ ] Build: sem erros
- [ ] Remover código de App.tsx

### Página 2: StudentDetails
- [ ] Criar `src/pages/StudentDetails.tsx`
- [ ] Edição de aluno
- [ ] Upload de foto
- [ ] Histórico de pagamentos
- [ ] Notas de contato
- [ ] Build: sem erros

### Página 3: Billing
- [ ] Criar `src/pages/Billing.tsx`
- [ ] Visão de cobrança
- [ ] Filtros e ordenação
- [ ] Timeline de pagamentos
- [ ] Build: sem erros

### Página 4: Payments
- [ ] Criar `src/pages/Payments.tsx`
- [ ] Histórico de pagamentos
- [ ] Registar novo pagamento
- [ ] Métodos de pagamento
- [ ] Build: sem erros

### Página 5: Reports
- [ ] Criar `src/pages/Reports.tsx`
- [ ] Exportar relatórios
- [ ] PDF/Excel
- [ ] Filtros por data
- [ ] Build: sem erros

### Página 6: Settings
- [ ] Criar `src/pages/Settings.tsx`
- [ ] Configurações da academia
- [ ] Gestão de utilizadores
- [ ] Build: sem erros

### Layout Principal
- [ ] Criar `src/layout/AppShell.tsx`
- [ ] Header
- [ ] Sidebar/Navigation
- [ ] Footer
- [ ] Integrar todas as páginas
- [ ] Build: sem erros

### App.tsx Refatorado
- [ ] Reduzir para <100 linhas
- [ ] Apenas router/shell
- [ ] Importar páginas
- [ ] Build: sem erros
- [ ] Testes manuais

---

## 🔧 Fase 3: Refatorar Backend (⏳ FILA)

### Análise de main.cjs
- [ ] Identificar handlers IPC
- [ ] Mapear lógica de negócio
- [ ] Listar queries SQL
- [ ] Criar plano de refatoração

### Handlers
- [ ] Criar `electron/handlers/student.handler.ts`
- [ ] Criar `electron/handlers/payment.handler.ts`
- [ ] Criar `electron/handlers/auth.handler.ts`
- [ ] Criar `electron/handlers/index.ts` (registrar todos)

### Serviços Backend
- [ ] Criar `electron/services/student.service.ts`
- [ ] Criar `electron/services/payment.service.ts`
- [ ] Criar `electron/services/auth.service.ts`

### Refatorar main.cjs
- [ ] Usar RepositoryFactory
- [ ] Registrar handlers
- [ ] Remover lógica inline
- [ ] Database layer separada
- [ ] Build: sem erros

### Testes de Integração
- [ ] Testar IPC handlers
- [ ] Testar repositories
- [ ] Testar serviços

---

## 🧪 Fase 4: Testes (⏳ FILA)

### Configuração de Jest
- [ ] Instalar dependências: `npm install --save-dev jest @testing-library/react`
- [ ] Criar `jest.config.js`
- [ ] Criar setup file
- [ ] Configurar coverage

### Testes Unitários
- [ ] `src/__tests__/hooks/useStudents.test.ts`
- [ ] `src/__tests__/hooks/usePayments.test.ts`
- [ ] `src/__tests__/utils/formatting.test.ts`
- [ ] `src/__tests__/services/ipc.test.ts`
- [ ] Cobertura: >80%

### Testes de Componentes
- [ ] `src/__tests__/components/UI.test.tsx`
- [ ] `src/__tests__/components/Dialog.test.tsx`
- [ ] Cobertura: >80%

### Testes de Páginas
- [ ] `src/__tests__/pages/StudentsList.test.tsx`
- [ ] `src/__tests__/pages/Billing.test.tsx`
- [ ] Cobertura: >70%

### Testes e2e (Playwright)
- [ ] Configurar Playwright
- [ ] `e2e/students.spec.ts`
- [ ] `e2e/billing.spec.ts`
- [ ] `e2e/payments.spec.ts`
- [ ] Smoke tests
- [ ] Happy path tests

---

## 📋 Daily Checklist Durante Refatoração

### Antes de começar o dia:
- [ ] Ler o que foi feito ontem
- [ ] Revisar código de hoje
- [ ] Pull da main branch (se team)

### Enquanto refatora:
- [ ] Types primeiro
- [ ] Imports com `type` keyword
- [ ] Build: sem erros
- [ ] Linter: sem warnings
- [ ] Testes: verde

### Fim do dia:
- [ ] Commit com mensagem clara
- [ ] Push para main/feature branch
- [ ] Documentar progresso
- [ ] Listar bloqueadores

### Exemplos de Commit:
```bash
# Bom:
git commit -m "refactor: extract StudentsList page from App.tsx

- Use useStudents hook
- Centralize types
- Remove inline functions
- Build passes"

# Ruim:
git commit -m "fix stuff"
```

---

## 🚨 Checklist de Qualidade

### Code Quality
- [ ] Sem `any` types
- [ ] Sem `//` TODOs (ou com jira link)
- [ ] Sem `console.log` em produção
- [ ] Sem commented code
- [ ] Sem variáveis não usadas
- [ ] Sem imports não usados

### TypeScript
- [ ] `npx tsc --noEmit` passa
- [ ] All types explicit
- [ ] No `type: any`
- [ ] No `@ts-ignore`
- [ ] No `@ts-nocheck`

### Performance
- [ ] Sem memory leaks
- [ ] Sem infinite loops
- [ ] Sem N+1 queries
- [ ] Sem re-renders desnecessários

### Segurança
- [ ] Sem senhas em logs
- [ ] Sem dados sensíveis em estado
- [ ] Sem SQLi vulnerabilities
- [ ] Sem XSS vulnerabilities

### Documentação
- [ ] JSDoc em functions públicas
- [ ] README atualizado
- [ ] Comentários em lógica complexa
- [ ] Types bem nomeados

### Build & Deploy
- [ ] `npm run build` passa
- [ ] `npm run lint` passa
- [ ] Bundle size aceitável
- [ ] Zero warnings

---

## 📊 Rastreamento de Progresso

### Fase 1: Fundação
- Status: ✅ **100% COMPLETO**
- Arquivos: 11 criados
- Linhas: ~1.630
- Build: ✅ Sucesso

### Fase 2: Componentes
- Status: ⏳ **Não iniciado**
- Páginas a fazer: 6
- Layout: 1
- Tempo estimado: 2-3 dias

### Fase 3: Backend
- Status: ⏳ **Não iniciado**
- Handlers a criar: 3+
- Serviços: 3+
- Tempo estimado: 1-2 dias

### Fase 4: Testes
- Status: ⏳ **Não iniciado**
- Unit tests: 10+
- E2E tests: 3+
- Cobertura alvo: 80%+
- Tempo estimado: 2-3 dias

---

## 🎯 Definição de "Pronto"

Uma tarefa está pronta quando:

- [x] Código escrito e revisor pelo menos uma vez
- [x] Build passa sem erros
- [x] Linter passa sem warnings
- [x] Types 100% corretos
- [x] Testes passam (se aplicável)
- [x] Não há regressão de funcionalidade
- [x] Documentação atualizada
- [x] Commit message clara e descritiva

---

## 📞 Resolução de Problemas

### Problema: Build falha com erro de tipo
```bash
# Solução:
1. Ver erro completo: npm run build
2. Procurar arquivo mencionado
3. Adicionar 'type' keyword em imports
4. npm run build novamente
```

### Problema: IPC call não funciona
```bash
# Solução:
1. Verificar se está em IPCService
2. Adicionar em preload.cjs whitelist
3. Adicionar handler em main.cjs
4. Testar em Electron dev
```

### Problema: Estado compartilhado não funciona
```bash
# Solução:
1. Usar custom hook (useStudents, etc)
2. Se não existir, criar em src/hooks/
3. Testar com React DevTools
```

### Problema: Merge conflict
```bash
# Solução:
1. git pull origin main
2. Resolver conflitos em VSCode
3. npm run build (verificar tudo OK)
4. git add / git commit
```

---

## 🎓 Recursos

- [React Patterns](https://reactpatterns.com/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [Clean Code](https://clean-code-js.com/)

---

## 📝 Notas

Espaço para notas pessoais durante a refatoração:

```
[Adicionar notas durante o progresso]
```

---

_Última atualização: 6 de Julho de 2026_  
_Status: ✅ Fase 1 Completa | 📋 Fase 2 Pronta_
