<div align="center">

<img src="public/next-level-v01-2026.svg" alt="Next Level Academia Logo" width="180" />

# Next Level Academia

### Sistema de Gestão Profissional para Academias e Ginásios

**Desenvolvido por [NEXT LAB](https://github.com/ivaldinofortes) · Cabo Verde 🇨🇻**

[![Versão](https://img.shields.io/badge/versão-1.0.0-stable-green?style=for-the-badge)](https://github.com/ivaldinofortes/next-level-app/releases)
[![Electron](https://img.shields.io/badge/Electron-31.7.7-47848F?style=for-the-badge&logo=electron)](https://electronjs.org)
[![React](https://img.shields.io/badge/React-19.2.5-61DAFB?style=for-the-badge&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=for-the-badge&logo=typescript)](https://typescriptlang.org)
[![SQLite](https://img.shields.io/badge/SQLite-better--sqlite3-003B57?style=for-the-badge&logo=sqlite)](https://sqlite.org)
[![Plataforma](https://img.shields.io/badge/Plataforma-Windows%20%7C%20macOS-lightgrey?style=for-the-badge)](https://github.com/ivaldinofortes/next-level-app/releases)

</div>

---

## 📖 Sobre o Projeto

O **Next Level Academia** é uma aplicação desktop nativa, completa e offline-first, desenvolvida especificamente para o mercado de gestão de academias, ginásios e estúdios de Cabo Verde e países lusófonos. O sistema permite gerir matrículas, cobranças, comunicação com alunos e relatórios operacionais — tudo sem precisar de ligação à internet.

A filosofia de design é baseada em **densidade de informação com clareza visual**, inspirando-se nas interfaces nativas de aplicações desktop modernas (Windows 11 / macOS), sendo que toda a interface foi construída do zero, sem dependências pesadas de bibliotecas de componentes UI.

> **"Rápido como uma aplicação nativa. Poderoso como um sistema ERP. Simples como uma planilha."**

---

## 🆕 Novidades da v1.0.0-beta.1.1

### 🎨 Sistema de Temas (Novidade)
- **3 temas completos** aplicados a todo o sistema via variáveis CSS:
  - **Claro** — Padrão profissional com tons azuis
  - **Escuro** — Conforto nocturno com fundo cinzento escuro
  - **Claude** — Paleta quente em terracota/creme, inspirada no Claude.ai
- Selector visual de temas em **Ajustes → Aparência** com pré-visualização em miniatura
- Tema persistido localmente e aplicado imediatamente sem reiniciar
- Regra de design: fundos seguem o tema, listas e superfícies mantêm-se sempre claras

### 📊 Página de Relatório Detalhado (Novidade)
- Acessível na barra de navegação superior (exclusivo para admins)
- **Design de folha A4** com cabeçalho da academia, rodapé com timestamp de exportação
- **Gráfico de donut SVG** com distribuição de estados de pagamento (Pagos / Em dia / Atrasados / Inativos)
- **Gráfico de barras SVG** com receita mensal dos últimos 6 meses
- **KPIs visuais** em grelha: total de alunos, pagos, em alerta, atrasados
- **Tabela numerada** de alunos com estado de cobrança codificado por cor
- **Resumo financeiro** com receita total, percentagem de pagamentos e média por aluno
- Filtro por mês/ano com timeline de navegação integrada
- Exportação **Excel** período-específica com `Guardar como...`
- Exportação **PDF** do relatório como documento imprimível

### 🔧 Melhorias de Integração de Temas
- Página de **Ajustes** completamente adaptada aos 3 temas (todas as secções: Geral, Aparência, Utilizadores, Notificações, Operação, Ajuda)
- Substituição sistemática de classes `bg-white`/`bg-slate-*`/`border-slate-*` por variáveis CSS (`var(--bg-surface)`, `var(--border)`, etc.)
- Página de **Relatório** usa `var(--bg-app)` para o fundo exterior, mantendo o papel branco imutável

### 🧮 Motor de Cobrança (billing.ts)
- Retornos antecipados (`bloqueado`, `suspenso`, `pausado`) agora incluem `monthsInDebt` e `rating` obrigatórios
- Lógica de cor da régua de tempo corrigida:
  - 🔵 Azul → dentro do período pago
  - 🟢 Verde → pago
  - 🔴 Vermelho → em atraso
- Meses futuros removidos completamente da timeline (não apenas ocultados)
- Página de Relatórios filtra alunos corretamente pelo período selecionado

### 📦 Distribuição com Seed Database
- `resources/seed.db` pré-configurado incluído no instalador Windows
- Na primeira instalação, o sistema copia automaticamente o seed para `userData`
- Configurações da academia pré-carregadas; wizard de setup cria o admin na primeira abertura
- Banner e logótipo padrão incluídos como assets estáticos (sem depender de cloud)

---

## ✨ Funcionalidades Completas

### 👥 CRM e Gestão de Alunos
- **Matrícula Completa:** Registo detalhado com dados pessoais, biométricos, objetivos e plano de pagamento
- **Timeline Inteligente:** Filtro temporal cumulativo — visualize a base de clientes exatamente como estava em qualquer mês passado, excluindo meses futuros
- **Perfil Ultra-Compacto:** Painel de detalhes em grelha de 3 colunas (Perfil, Finanças, Comunicação) sem necessidade de scroll
- **Soft Delete:** Alunos eliminados são arquivados, preservando todo o histórico financeiro
- **Upload de Foto:** Fotografias de perfil guardadas localmente no sistema de ficheiros

### 💰 Gestão Financeira
- **Registo de Pagamentos:** Suporte a múltiplos métodos (Dinheiro, Cartão, Transferência)
- **Histórico por Aluno:** Rastreamento completo de mensalidades pagas e em atraso com rating de 1–5
- **Motor de Cobrança (`billing.ts`):** Cálculo automático de dias em atraso, cobertura do período, meses em dívida e estado de pagamento
- **Relatórios Mensais:** Página dedicada com gráficos SVG, KPIs e tabela exportável
- **Exportação Excel:** Dossier operacional `.xlsx` filtrado pelo período selecionado
- **Integração WhatsApp:** Geração automática de links `wa.me` com mensagens de cobrança pré-formatadas

### 🎨 Aparência e Temas
- **3 Temas Completos:** Claro, Escuro e Claude — comutáveis em tempo real
- **Branding Personalizado:** Logótipo e banner de login configuráveis por academia
- **Slideshow de Login:** Até 5 imagens que passam automaticamente no painel de login; modo apresentação quando inativo
- **Sistema de CSS Variables:** Todas as cores e superfícies definidas via variáveis para troca instantânea de tema

### 🔔 Notificações e Alertas
- Notificações nativas do sistema operativo para eventos críticos
- Alertas de backup periódico configuráveis por categoria (Pagamentos, Matrículas, Relatórios)
- Histórico de notificações com estado de leitura persistente

### ⚙️ Administração e Segurança
- **Multi-Utilizador:** Suporte a perfis `admin` e `operational` com níveis de acesso distintos
- **Acesso Rápido:** Utilizadores marcados como favoritos aparecem no login sem inserir senha
- **Autenticação Segura:** Palavras-passe encriptadas com `scrypt` + Salt aleatório (sem texto plano em nenhum momento)
- **Auditoria Total:** Registo de logs de todas as ações críticas (quem fez, quando e o quê)
- **Backups em ZIP:** Empacotamento completo da base de dados + fotografias num único ficheiro `.zip`
- **Restauro de Backup:** Restauro com um clique a partir de ficheiro `.zip`
- **Acesso Root:** Canal de suporte técnico dedicado com credenciais separadas (NEXT LAB)
- **Licenciamento Integrado:** Sistema de chaves de licença por cliente (teste / comercial / expiração)

### 🏢 Configurações da Academia
- Nome, logótipo, morada, email e telefone da academia
- Categorias de planos personalizáveis (Musculação, Cardio, Crossfit, etc.)
- Template de mensagem WhatsApp totalmente editável
- Pasta de destino de backups e exportações configurável e persistente

---

## 🛠️ Arquitetura e Stack Tecnológica

O projeto segue a **arquitetura de dois processos do Electron** (Main + Renderer) com comunicação via IPC (Inter-Process Communication).

```
┌──────────────────────────────────────────────────────┐
│                   RENDERER PROCESS                   │
│                                                      │
│   React 19 + TypeScript + Vite + Tailwind CSS        │
│   src/App.tsx  ←→  src/lib/billing.ts                │
│                                                      │
│   Sistema de Temas: CSS Variables (3 temas)          │
│   Gráficos: SVG nativo (donut + barras)              │
│                                                      │
│              IPC via ipcRenderer                     │
└───────────────────┬──────────────────────────────────┘
                    │ IPC Handlers
┌───────────────────▼──────────────────────────────────┐
│                    MAIN PROCESS                      │
│                                                      │
│   main.cjs (Electron + Node.js)                      │
│   ├── better-sqlite3 (Base de Dados Local)           │
│   ├── adm-zip (Backups em ZIP)                       │
│   ├── xlsx (Exportações Excel)                       │
│   ├── crypto (Hashing de Passwords)                  │
│   ├── seed.db → cópia automática no 1.º arranque    │
│   └── Sistema de Licenciamento                       │
│                                                      │
│   nextlevel.db → userData do Electron                │
└──────────────────────────────────────────────────────┘
```

### 📦 Dependências de Produção

| Pacote | Versão | Função |
|--------|--------|--------|
| `electron` | 31.7.7 | Runtime Desktop |
| `react` | 19.2.5 | Framework de UI |
| `better-sqlite3` | 12.9.0 | Base de Dados Local |
| `adm-zip` | 0.5.17 | Backups em ZIP |
| `xlsx` | 0.18.5 | Exportação Excel |
| `jspdf` + `jspdf-autotable` | 4.2.1 / 5.0.7 | Geração de PDFs |
| `lucide-react` | 1.8.0 | Ícones |

### 🔧 Ferramentas de Desenvolvimento

| Ferramenta | Versão | Função |
|------------|--------|--------|
| `vite` | 8.0.9 | Build Tool + Dev Server |
| `typescript` | 6.0.2 | Type Safety |
| `tailwindcss` | 3.4.1 | Estilização Utilitária |
| `electron-builder` | 24.13.3 | Empacotamento e Instaladores |
| `@electron/rebuild` | 4.0.4 | Recompilação de módulos nativos |

---

## 🗃️ Modelo de Dados (SQLite)

```sql
-- Alunos com suporte a Soft Delete
alunos (id, nome, telefone, email, sexo, data_nascimento,
        morada, alergias, objetivos, horario_preferido,
        plano, vencimento, categoria, modo_cobranca,
        data_matricula, status, foto_path, notas, deleted)

-- Histórico Financeiro Completo
pagamentos (id, aluno_id, valor, status, data_pagamento,
            metodo_pagamento, mes_referencia,
            referencia_inicio, referencia_fim)

-- CRM: Notas e Ocorrências
notas_contacto (id, aluno_id, texto, data_criacao)

-- Utilizadores e Controlo de Acesso
users (id, name, email, role, password_salt,
       password_hash, is_active, created_at, last_login_at)

-- Acesso Root (Suporte NEXT LAB)
root_access (id, email, senha_salt, senha_hash,
             permissoes, ultimo_acesso, data_criacao)

-- Auditoria de Ações
logs (id, acao, detalhes, data_hora, user_name)

-- Logs Técnicos (Erros e Diagnóstico)
logs_tecnicos (id, tipo, contexto, mensagem, stack,
               utilizador, data_hora)

-- Configurações Key-Value
configuracoes (chave, valor)
-- Chaves relevantes: nome_academia, logo_path, banner_academia,
--   morada_academia, email_academia, telefone_academia,
--   categorias, setup_completed, license_key, license_expiry,
--   whatsapp_template, desktop_notifications, backup_reminder_enabled
```

---

## 🚀 Instalação e Desenvolvimento

### Pré-requisitos

- **Node.js** `>= 18.x`
- **npm** `>= 9.x`
- **Git**

> ⚠️ O módulo `better-sqlite3` requer binários nativos. Em caso de erro de módulo, consulte a secção [Reconstrução de Módulos Nativos](#-reconstrução-de-módulos-nativos).

### Clonar e Instalar

```bash
# Clonar o repositório
git clone https://github.com/ivaldinofortes/next-level-app.git
cd next-level-app

# Instalar dependências
npm install

# Reconstruir módulos nativos para o Electron
npm run rebuild
```

### Iniciar em Modo de Desenvolvimento

```bash
# Terminal 1 — servidor Vite (porta 3000)
npm run dev

# Terminal 2 — app desktop nativa
npm run start:native
```

> Equivalente: `VITE_DEV_SERVER_URL=http://127.0.0.1:3000 npm run electron`  
> Windows (CMD): `set VITE_DEV_SERVER_URL=http://127.0.0.1:3000 && npm run electron`

### Build de Produção / Entrega

```bash
# Qualidade mínima (testes + frontend + artefactos)
npm run verify

# Instaladores Windows (NSIS + portable) → pasta release/
npm run dist:win
```

Guia de entrega ao cliente: [`docs/RELEASE_v1.0.0.md`](docs/RELEASE_v1.0.0.md)

---

## 🔨 Reconstrução de Módulos Nativos

O `better-sqlite3` compila binários específicos para cada versão do Electron. Se vires um erro de módulo nativo ao arrancar:

```bash
# Opção 1 — Script npm
npm run rebuild

# Opção 2 — Versão explícita
./node_modules/.bin/electron-rebuild -v 31.7.7 -f
```

Este comando recompila todos os módulos nativos para a versão correta do Electron instalada no projeto.

---

## 📦 Scripts Disponíveis

| Script | Comando | Descrição |
|--------|---------|-----------|
| Desenvolvimento (UI) | `npm run dev` | Servidor Vite com HMR (porta 3000) |
| Electron (dev) | `npm run start:native` | Electron ligado ao Vite em `127.0.0.1:3000` |
| Verificar release | `npm run verify` | Testes + build frontend + checklist de ficheiros |
| Build Frontend | `npm run build` | Compila TypeScript + Vite para `dist/` |
| Windows | `npm run dist:win` | Instalador NSIS + portable em `release/` |
| Distribuição | `npm run dist` | Build + instaladores da plataforma atual |
| Reconstrução Nativos | `npm run rebuild` | Recompila `better-sqlite3` para o Electron |
| Lint | `npm run lint` | Verificação de código com ESLint |

---

## 🖼️ Interface e Design System

### Sistema de Temas

A interface suporta **3 temas completos** comutáveis em tempo real via CSS Variables:

| Variável | Função |
|----------|--------|
| `--bg-app` | Fundo principal da aplicação |
| `--bg-surface` | Superfícies (cards, listas, painéis) |
| `--bg-header` | Cabeçalho e barra de navegação |
| `--border` | Bordas primárias |
| `--border-light` | Bordas subtis / divisores |
| `--color-primary` | Cor de destaque principal |
| `--color-secondary-lighter` | Fundo de hover e áreas secundárias |
| `--text-primary` | Texto principal |
| `--text-secondary` | Texto secundário / muted |

**Regra de design:** o fundo da app segue o tema; listas, tabelas e superfícies de conteúdo mantêm-se sempre claras (`--bg-surface`).

### Filosofia Desktop Nativo

A interface foi construída afastando-se do paradigma de "site dentro de uma janela":

- **Modais Padronizados (Estilo Windows/macOS):**
  - Cabeçalho com logótipo + título centralizado + botão de fechar
  - Corpo com formulário limpo sobre fundo de superfície
  - Rodapé fixo com botões de ação (Cancelar | Ação Principal)

- **Sistema de Cores Funcional:**
  - 🔵 **Azul** — Dentro do período de cobertura (pagamento ativo)
  - 🟢 **Verde** — Pago e em dia
  - 🔴 **Vermelho** — Em atraso ou bloqueado
  - 🟡 **Âmbar** — Alerta / vence em breve

- **Layouts de Alta Densidade:**
  - Substituição de listas longas por grelhas compactas
  - Painel de aluno em 3 colunas (Perfil | Finanças | Comunicação)
  - Timeline temporal de clientes sem scroll desnecessário
  - Gráficos SVG nativos (donut + barras) sem bibliotecas externas

---

## 🔒 Segurança

| Aspeto | Implementação |
|--------|---------------|
| Passwords | `crypto.scryptSync` com Salt de 16 bytes aleatórios |
| Comparação | `crypto.timingSafeEqual` (imune a timing attacks) |
| Utilizadores inativos | Bloqueio imediato no login |
| Dados em repouso | SQLite local, nunca enviado para a nuvem |
| Auditoria | 100% das ações críticas são registadas em `logs` |
| Suporte Técnico | Canal root separado (`root_access`) com credenciais exclusivas |

---

## 🏗️ Estrutura do Projeto

```
next-level-app/
├── main.cjs              # Processo Principal do Electron (backend + IPC)
├── index.html            # Ponto de entrada HTML
├── package.json          # Dependências, scripts e configuração electron-builder
├── vite.config.ts        # Configuração do Vite
├── tailwind.config.js    # Configuração do Tailwind CSS
│
├── src/
│   ├── App.tsx           # Componente raiz principal (UI completa)
│   ├── main.tsx          # Entry point do React
│   ├── index.css         # Estilos globais + classes utilitárias nl-*
│   └── lib/
│       └── billing.ts    # Motor de cálculo de cobrança e estados
│
├── public/               # Assets estáticos (logótipos, banners, ícones)
│   ├── next-level-v01-2026.svg       # Logótipo principal
│   └── next-oficial wallpapers.jpg  # Banner padrão do login
│
├── resources/
│   └── seed.db           # Base de dados pré-configurada para 1.ª instalação
│
├── build/                # Recursos para o instalador (icon.png)
└── dist/                 # Output do build (gerado automaticamente)
```

---

## 📋 Roadmap

### ✅ Concluído (v1.0.0 estável — Windows-first)
- [x] Sistema de login com autenticação encriptada
- [x] Gestão completa de alunos (CRUD + Soft Delete)
- [x] Timeline temporal de matrículas (sem meses futuros)
- [x] Histórico e registo de pagamentos com rating 1–5
- [x] Motor de cobrança (`billing.ts`) com cobertura de período e meses em dívida
- [x] Notas e ocorrências por aluno (CRM)
- [x] Sistema de backups (ZIP com DB + fotos)
- [x] Exportação operacional em Excel (período-específica)
- [x] Integração WhatsApp (wa.me com template editável)
- [x] Sistema de logs de auditoria
- [x] Gestão de utilizadores (admin + operacional + acesso rápido)
- [x] Configurações da academia (nome, logo, banner, morada)
- [x] Licenciamento interno (chaves de cliente)
- [x] Sistema de 3 Temas (Claro, Escuro, Claude) com CSS Variables
- [x] Página de Relatório Detalhado com gráficos SVG e exportação Excel/PDF
- [x] Slideshow de Login com modo apresentação
- [x] Seed database pré-configurado no instalador Windows
- [x] Instalador NSIS + portable Windows + auto-updater
- [x] Importação de alunos via Excel
- [x] Testes de domínio + `npm run verify` + guia `docs/RELEASE_v1.0.0.md`

### 🔜 Próximas Versões (v1.0.1 / v1.1)
- [ ] Continuar a esvaziar `App.tsx` e remover `@ts-nocheck`
- [ ] Virtualização de listas grandes
- [ ] Instalador macOS notariado (sob demanda)
- [ ] Gráfico de evolução de alunos mês a mês
- [ ] Handlers Electron por domínio

---

## 👤 Autor e Créditos

**Ivaldino da Luz Fortes**
- 🌐 GitHub: [@ivaldinofortes](https://github.com/ivaldinofortes)
- 📧 Email: ivaldinofortes@gmail.com
- 🏝️ Cabo Verde 🇨🇻

**NEXT LAB** — Soluções de Software para o Mercado Cabo-verdiano

---

## 📄 Licença

Este projeto é **software proprietário**. Todos os direitos reservados.
A distribuição, cópia ou modificação sem autorização expressa do autor é proibida.

© 2026 Ivaldino Fortes / NEXT LAB. Todos os direitos reservados.

---

<div align="center">
  <sub>Construído com ❤️ em Cabo Verde 🇨🇻 · Powered by Electron + React + SQLite</sub>
</div>
