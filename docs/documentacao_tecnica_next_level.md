# Documentação Técnica: Next Level Academia

## 1. Visão Geral
O **Next Level Academia** é um sistema de Gestão de Academias (Gym Management System) desenvolvido como uma aplicação Desktop nativa utilizando a arquitetura **Electron**. O foco principal é a gestão de membros (alunos), controlo financeiro de mensalidades e acompanhamento de contactos (CRM).

---

## 2. Stack Tecnológica
*   **Runtime**: Electron (Node.js + Chromium)
*   **Frontend**: React 19 (com Hooks e State Management nativo)
*   **Linguagem**: TypeScript (Strict Mode)
*   **Build Tool**: Vite (para o processo de renderização)
*   **Base de Dados**: SQLite via `better-sqlite3` (Persistência local rápida e síncrona)
*   **Estilização**: Tailwind CSS + Custom CSS Variables (Design System inspirado em GNOME e Trello)
*   **Ícones**: Lucide React
*   **Utilitários**:
    *   `jsPDF` & `jspdf-autotable`: Geração de recibos e relatórios em PDF.
    *   `XLSX (SheetJS)`: Exportação de dados para Excel.
    *   `adm-zip`: Sistema de backups e exportação de dossier operacional.

---

## 3. Estrutura do Projeto
*   `main.cjs`: Ponto de entrada do Electron. Gere janelas, ciclo de vida da app e acesso direto ao hardware/sistema de ficheiros.
*   `src/App.tsx`: Componente monolítico que gere todas as rotas e estados da UI (Dashboard, Alunos, Financeiro, Configurações).
*   `src/lib/billing.ts`: Biblioteca central de lógica de negócio (cálculos de datas, status de cobrança e janelas de cobertura).
*   `src/main.tsx`: Entry point do React.
*   `package.json`: Gestão de dependências e scripts de build (`dev`, `electron`, `build`).

---

## 4. Modelo de Dados (SQLite)

### Tabela: `alunos`
Armazena o cadastro mestre de todos os utilizadores do sistema.
*   `id`: UUID/String (Chave Primária)
*   `nome`, `telefone`, `email`: Dados de contacto.
*   `status`: `ativo`, `pausado`, `suspenso`, `bloqueado`.
*   `plano`: Valor monetário da mensalidade.
*   `vencimento`: Data do próximo pagamento esperado.
*   `data_matricula`: Data de registo original.
*   `foto_path`: Caminho local para a imagem de perfil.
*   `deleted`: Boolean (Soft Delete para lixeira).

### Tabela: `pagamentos`
Registo histórico de todas as transações.
*   `aluno_id`: Chave estrangeira para `alunos`.
*   `valor`: Valor pago.
*   `metodo_pagamento`: `Dinheiro`, `Multicaixa`, `Transferência`.
*   `mes_referencia`: Mês a que o pagamento se aplica.
*   `referencia_inicio`/`referencia_fim`: Datas de cobertura da mensalidade.

### Tabela: `users`
Controlo de acesso ao sistema.
*   `role`: `admin` (acesso total) ou `operational` (acesso limitado).
*   `password_hash` / `password_salt`: Segurança via algoritmo `scrypt`.

### Outras Tabelas:
*   `configuracoes`: Chave/Valor para definições globais (Nome da academia, Logótipo, Temas).
*   `notas_contacto`: Histórico de interações CRM por aluno.
*   `logs`: Audit trail de ações críticas (Login, Eliminação de alunos, Exportações).

---

## 5. Lógica de Negócio (Billing Engine)
O sistema utiliza uma lógica de **Janela de Cobertura Dinâmica**:
1.  Ao registar um pagamento, o sistema calcula o `referencia_fim` somando 1 mês à data de vencimento atual ou à data do pagamento.
2.  O status do aluno é calculado em tempo real (Runtime):
    *   **Atrasado**: Data atual > Data de vencimento.
    *   **Crítico**: Vencimento nos próximos 3 dias.
    *   **Pendente**: Vencimento nos próximos 7 dias.
    *   **Em Dia**: Vencimento em mais de 7 dias.

---

## 6. Comunicação IPC (Inter-Process Communication)
A aplicação utiliza o `ipcRenderer.invoke` (frontend) para comunicar com o `ipcMain.handle` (backend).
Principais Handlers implementados:
*   `get-alunos`: Retorna lista filtrada.
*   `add-pagamento`: Insere transação e atualiza o vencimento do aluno atomicamente.
*   `export-operational-report`: Gera um ficheiro Excel consolidado com Alunos, Pagamentos e Logs.
*   `upload-foto`: Processa e guarda imagens no diretório `userData` do sistema operativo.

---

## 7. Interface e Design System
O aplicativo implementa um sistema de temas robusto via CSS Variables:
*   **Modo Escuro/Claro**: Alternância dinâmica sem recarregamento.
*   **Paleta**: Cores inspiradas no Windows 11 (Primary: #0065FF, Success: #61BD4F).
*   **Tipografia**: Utiliza a família `IBM Plex Sans` para legibilidade em monitores de alta densidade.
*   **Componentes**: Uso intensivo de Modais (Radix-like), Toasts de notificação e Timeline Progress Bars para visualização financeira.

---

## 8. Recomendações de Evolução (Technical Debt)
Para a equipa de desenvolvimento que assumir o projeto, recomendam-se os seguintes passos:
1.  **Modularização do `App.tsx`**: O ficheiro atual é um monólito. Deve ser dividido em pastas de `/components`, `/hooks` e `/views`.
2.  **Context API / State Management**: Migrar o estado global para `Zustand` ou `React Context` para evitar Prop Drilling.
3.  **Abstração do Banco de Dados**: Criar uma camada de Repositórios/Services no Processo Principal para isolar a lógica SQL do IPC Handler.
4.  **Testes**: Implementação de testes unitários para a lógica de faturação em `billing.ts`.

---
**Documentação gerada em**: 28 de Abril de 2026
**Responsável**: Antigravity AI Assistant
