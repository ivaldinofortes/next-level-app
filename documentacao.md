# 🚀 NextLevel Academia - Documentação Técnica e Funcional

Este documento fornece um mapeamento detalhado e atualizado do sistema **NextLevel Academia** (v1.0.0-beta.1.1), abordando a sua arquitetura, design visual moderno, funcionalidades centrais e as lógicas de negócio implementadas.

---

## 📋 1. Visão Geral do Sistema
O **NextLevel Academia** é uma aplicação desktop nativa (baseada em Electron) desenvolvida para a gestão completa de academias, ginásios e estúdios. O foco principal é a **densidade de informação aliada à clareza visual**, permitindo que o administrador faça matrículas, controle mensalidades, faça exportações contabilísticas e comunique com os alunos via WhatsApp — tudo num ambiente extremamente rápido, seguro e sem necessitar de ligação à internet para operar (offline-first).

---

## 🎨 2. Arquitetura Visual e Sistema de Temas

O sistema adota uma **estética de Aplicação Desktop Nativa (estilo macOS/GNOME/Windows 11)**, sem dependências pesadas de UI, suportada por um sistema flexível de CSS Variables.

*   **Sistema de Temas Dinâmico**:
    *   **3 Temas Completos**: **Claro** (padrão profissional com tons azuis), **Escuro** (conforto noturno com fundo cinzento escuro) e **Claude** (paleta quente em terracota/creme).
    *   A troca de tema é instantânea e persistida localmente.
    *   **Regra de Design**: O fundo principal da app segue o tema (`--bg-app`), mas as superfícies de conteúdo (listas, formulários, tabelas) mantêm-se limpas e de fácil leitura (`--bg-surface`).
*   **Janelas (Modais) Padronizadas**: Todos os formulários seguem o "Padrão Desktop" com cabeçalho padronizado (fundo distinto, logo e botão de fechar), corpo da janela limpo e rodapé fixo com botões de ação bem definidos à direita.
*   **Código de Cores Funcionais e Motor de Cobrança**:
    *   🔵 **Azul (`--color-primary`)**: Ações de gestão, navegação e identificação de aluno dentro do período pago de forma geral.
    *   🟢 **Verde (`#16a34a`)**: Estritamente reservado para operações financeiras e alunos perfeitamente em dia.
    *   🔴 **Vermelho/Laranja (`#dc2626` / `#d97706`)**: Zonas de perigo, eliminações, e alunos com pagamentos em atraso ou conta bloqueada.

---

## 👥 3. Módulo de Contactos (O Coração do CRM)

A área de "Contactos" é o módulo mais avançado e tático do sistema, dividido em 3 zonas interligadas:

### 3.1. Régua Temporal Inteligente (Timeline)
*   **Lógica Cumulativa**: Uma barra temporal superior que permite viajar no tempo. Ao clicar em "Fevereiro", o sistema lista **todos os alunos matriculados até Fevereiro** (início do ano + novos do mês selecionado).
*   **Ocultação do Futuro**: A timeline não conta nem exibe meses futuros.
*   **Visão Global (Botão "Todos")**: Permite desativar o filtro temporal e ver instantaneamente toda a base de dados do ginásio.

### 3.2. Diretório Deslizante (Sidebar Esquerda)
*   Listagem em tempo real de todos os alunos retornados pela timeline.
*   Inclui *tags* de estado (Ativo, Pausado, Bloqueado) e cálculos demográficos rápidos no cabeçalho.

### 3.3. Painel de Detalhes Ultra-Compacto (Grid 3 Colunas)
Para evitar scrolls constantes, a ficha do aluno está dividida em 3 colunas verticais visíveis de uma só vez:
1.  **Coluna 1 (Perfil & Segurança)**: Mostra Dados Pessoais, Detalhes de Matrícula (categoria, plano) e a **Zona de Perigo** (Pausar, Bloquear, Eliminar com *Soft Delete*). Inclui avatar a partir de foto local.
2.  **Coluna 2 (Financeiro)**: Estatísticas de pagamento resumidas em cartões e listagem do histórico de faturas em quadro rolável (com *rating* de confiança de 1 a 5).
3.  **Coluna 3 (Comunicação)**: Área exclusiva para adição e consulta de Notas/Ocorrências do aluno (com carimbo de data).

---

## 💰 4. Gestão Financeira Inteligente

*   **Motor de Cobrança (billing.ts)**: Lógica refinada que calcula dias em atraso, cobertura de tempo pago, e o parâmetro `monthsInDebt` para avaliar com precisão a validade do acesso do aluno.
*   **Validação Constante**: Bloqueios lógicos que impedem o registo de pagamentos com valores negativos ou nulos.
*   **Integração WhatsApp**: Ao registrar o pagamento, é possível gerar um link `wa.me` contendo uma mensagem de fatura preenchida com um *template* configurável para notificar o cliente.
*   **Página de Relatório Detalhado**: 
    *   Design visual no formato de "Folha A4" para dossiers operacionais impecáveis.
    *   **Gráficos em SVG Nativo**: Gráficos de Donut (Distribuição de Estados) e Barras (Receita dos Últimos 6 Meses) renderizados de forma limpa.
    *   **KPIs Visuais em Grelha**: Totais de alunos, faturados, atrasados, média e taxa de pagamentos.
    *   Geração e exportação perfeita dos dados filtrados para arquivos **Excel (`.xlsx`)** e relatórios prontos em **PDF**.

---

## ⚙️ 5. Operação, Backups e Segurança

*   **Autenticação e Multi-utilizador**: 
    *   Suporte para níveis `admin` e `operational`. Ecrã de Login estilo ecrã dividido, incorporando um modo de **Slideshow** que funciona como descanso de ecrã/apresentação.
    *   As senhas são encriptadas via `scrypt` com *Salt*, sem acesso a nuvem.
*   **Auditoria**: Log interno e silencioso das ações efetuadas na aplicação.
*   **Sistema de Backups**:
    *   Integrado entre o *Main* e o *Renderer* processo via IPC. O Administrador pode selecionar a pasta de destino fixa para todos os backups e relatórios.
    *   A aplicação compacta a Base de Dados SQLite e todas as Fotos dos Alunos num único arquivo `.zip` restaurável com um clique.
*   **Licenciamento Interno**: Controlo de licenças geridas internamente por *keys* validadas durante o arranque do sistema.

---

## 🛠️ 6. Stack Tecnológica

*   **Frontend**: React.js 19 + TypeScript + Vite 8.
*   **Estilização**: TailwindCSS (Customizado para UI nativa com variáveis CSS para os múltiplos temas).
*   **Processo Principal (Backend Desktop)**: Electron.js 31.7.
*   **Base de Dados**: `better-sqlite3` (Processamento local rápido sem atrasos de rede).
*   **Manipulação de Arquivos**: `adm-zip` (Zips), `xlsx` (Excel) e `jspdf` (Geração de relatórios PDF).

---

## 📦 7. Distribuição e Compilação (Build & Release)

Com a chegada da fase **Beta (`1.0.0-beta.1.1`)**, o sistema inclui uma infraestrutura completa de distribuição nativa usando o `electron-builder`.

### 7.1. Executáveis (Windows / macOS)
*   **Windows (NSIS)**: Criação de instaladores em 1-clique (ou diretório customizável), injetando atalhos no Desktop e Start Menu. Também suporta *builds* portáteis em ZIP.
*   **macOS**: App otimizada com categoria de negócio, pronta a correr no ambiente nativo da Apple.

### 7.2. Seed Database (Configuração Inicial)
O projeto agora incorpora um arquivo base `resources/seed.db`.
*   Durante a primeira instalação ou primeiro arranque no computador de destino, o sistema deteta a ausência da base de dados no diretório `userData` e **copia automaticamente o seed**.
*   Isto providencia uma base com todas as definições base estruturadas, facilitando imensamente o arranque ou *Wizard* de setup para um novo cliente.

### 7.3. Comandos Importantes
*   `npm run rebuild`: Recompila os módulos nativos de C++ para arquitetura atual (muito útil para o `better-sqlite3`).
*   `npm run dist`: Realiza o build final do front-end (`dist/`) e empacota automaticamente o Electron em instaladores finais.
