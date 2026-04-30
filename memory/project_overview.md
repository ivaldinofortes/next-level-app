---
name: Next Level Academia - Visão Geral do Projecto
description: Stack, arquitectura e estado do projecto Next Level Academia
type: project
---

Sistema de gestão de academia desktop (Electron + React 19 + TypeScript + Vite + Tailwind + SQLite via better-sqlite3).

**Why:** Gestão de alunos, mensalidades e faturação para uma academia em Cabo Verde (CVE).

**How to apply:** Ao sugerir alterações, manter a stack existente. Não adicionar dependências novas sem necessidade clara.

## Stack
- Frontend: React 19, TypeScript (`// @ts-nocheck` no App.tsx), Tailwind CSS
- Desktop: Electron 31 com `nodeIntegration: true`, `contextIsolation: false`
- DB: SQLite via `better-sqlite3` em `main.cjs`
- IPC: `electron.ipcRenderer.invoke(...)` no renderer, `ipcMain.handle(...)` no main
- PDF: jsPDF + jspdf-autotable
- Excel: xlsx (SheetJS)

## Arquitectura
- `src/App.tsx` (~260KB, ficheiro único monolítico, `// @ts-nocheck`)
- `src/lib/billing.ts` — lógica de billing pura (parseFlexibleDate, summarizeStudentBilling, buildCoverageWindow)
- `main.cjs` — processo Electron principal, IPC handlers, SQLite

## Tabelas SQLite
- `alunos` (id TEXT PK, nome, telefone, email, sexo, data_nascimento, morada, alergias, objetivos, horario_preferido, plano, vencimento, progresso, data_matricula, status, categoria, modo_cobranca, foto_path, notas, deleted)
- `pagamentos` (id, aluno_id FK, valor, status, data_pagamento, metodo_pagamento, mes_referencia, referencia_inicio, referencia_fim)
- `notas_contacto` (id, aluno_id FK, texto, data_criacao)
- `configuracoes` (chave PK, valor)
- `users` (id, name, email, role, password_salt, password_hash, is_active, created_at, last_login_at)
- `logs` (id, acao, detalhes, data_hora)

## Formatos de data
- `vencimento`: DD/MM/YYYY (formatPtDate)
- `data_matricula`: YYYY-MM-DD (input type=date)
- `data_pagamento`: DD/MM/YYYY (formatPtDate)
- `parseFlexibleDate` lida com ambos os formatos

## Polimento Beta 1 (Abril 2026)
- Design system unificado: `nl-card` 6px, `nl-btn` 5px, `nl-input` 5px, `nl-icon-btn` 6px, `nl-modal` 8px
- Timeline de Contactos migrada de cores hardcoded azul para CSS vars (coeso com Alunos)
- Header mais compacto (56px) e branding simplificado
- Nav pills: font-semibold, shadow-sm (sem shadow-lg excessivo)
- Home page: painéis `rounded-[8px]`, Centro de Operações usa `var(--bg-surface)` (não hardcode)
- User dropdown: `rounded-[4px]`, animação `animate-fade-in`, padding mais compacto
- Botões de modais (pagamento, registo, edição, relatório) migrados para classes `nl-btn`
- Botões de método pagamento no modal: usa CSS vars em vez de hardcode `bg-blue-600`
- Contactos: aluno selecionado no header mostra pill com nome (breadcrumb contextual)
- Contactos: botão "Ver em Alunos" (ExternalLink → BookUser) no perfil do aluno
- Contactos: empty state com botões "Ver Alunos" e "Novo Aluno" em vez de tips estáticas
- Gestão tabela: botão ir para Contactos mudou ícone para BookUser com hover mais visível

## Correcções feitas (Abril 2026)
- `calcularResumoCompleto` undefined → substituído por `summarizeStudentBilling`
- `contactosTimelineMesSel` tipo `number|null` → `string|null` (filtro por mês nos Contactos nunca funcionava)
- `carregarDados()` agora só dispara em `isLoggedIn` change, não em cada tab change
- `online` effect não causa duplo load no arranque (via `isFirstOnlineRef`)
- `novoAluno` resetado ao abrir form de matrícula e ao cancelar/guardar edição
- Auto-load de utilizadores e logs nas respectivas tabs de Configurações
- `eliminarAluno` limpa `alunoPerfil` e `alunoSelecionado` se era o aluno visível
- `pagamentosAluno` nos Contactos/Financeiro filtra por `alunoId || aluno_id`
- `get-pagamentos` usa LEFT JOIN (alunos deletados não perdem histórico de pagamentos)
- `add-aluno` persiste o campo `status`
- `get-logs` limite aumentado de 10 para 500
- `removerAluno` (código morto) removida
- Ver Perfil na Gestão agora abre o perfil directamente nos Contactos (setAlunoPerfil)
- `salvarConfig` não faz `carregarDados()` desnecessário após cada categoria
