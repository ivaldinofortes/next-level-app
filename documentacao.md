# 🚀 NextLevel Academia - Documentação Técnica e Funcional

Este documento fornece um mapeamento detalhado e atualizado do sistema **NextLevel Academia**, abordando a sua arquitetura, design visual moderno, funcionalidades centrais e as lógicas de negócio implementadas.

---

## 📋 1. Visão Geral do Sistema
O **NextLevel Academia** é uma aplicação desktop nativa (baseada em Electron) desenvolvida para a gestão completa de academias, ginásios e estúdios. O foco principal é a **densidade de informação aliada à clareza visual**, permitindo que o administrador faça matrículas, controle mensalidades, faça exportações contabilísticas e comunique com os alunos via WhatsApp — tudo num ambiente extremamente rápido, seguro e sem necessitar de ligação à internet para operar.

---

## 🎨 2. Arquitetura Visual e Design System

O sistema foi alvo de uma modernização profunda, abandonando as tradicionais interfaces web e adotando uma **estética de Aplicação Desktop Nativa (estilo macOS/GNOME/Windows 11)**:

*   **Janelas (Modais) Padronizadas**: Todos os formulários (Nova Matrícula, Editar Registo, Registo de Pagamento, Relatório Mensal e Configuração Inicial) seguem o rigoroso "Padrão Windows":
    *   **Cabeçalho Controlado**: Fundo ligeiramente cinza (`#F1F4F9`), logótipo ao canto esquerdo, título centrado e botão de fechar à direita.
    *   **Corpo da Janela**: Fundo branco ou `var(--bg-surface)` limpo, com inputs e selectores alinhados.
    *   **Rodapé Fixo**: Botões de ação bem definidos à direita (Cancelar + Acção Principal).
*   **Código de Cores Funcionais**:
    *   **Azul (`--color-primary`)**: Acções de gestão, submissões genéricas, e navegação.
    *   **Verde (`#16a34a`)**: Estritamente reservado para operações financeiras e pagamentos.
    *   **Vermelho/Laranja (`#dc2626` / `#d97706`)**: Zonas de perigo, bloqueio de utilizadores e eliminações.
*   **Densidade e Layouts Compactos**: Substituição de layouts extensos de scroll por **Grelhas (Grids)** que apresentam toda a informação de uma só vez (ex: O novo painel de detalhes de um aluno).

---

## 👥 3. Módulo de Contactos (O Coração do CRM)

A área de "Contactos" é o módulo mais avançado e tático do sistema, dividido em 3 zonas interligadas:

### 3.1. Régua Temporal Inteligente (Timeline)
*   **Lógica Cumulativa**: Uma barra temporal superior permite viajar no tempo. Ao clicar em "Fevereiro", o sistema lista **todos os alunos matriculados até Fevereiro** (janeiro + novos de fevereiro).
*   **Ocultação de Futuro**: A timeline não conta "falsos alunos" em meses futuros.
*   **Visão Global (Botão "Todos")**: Permite desativar o filtro temporal e ver instantaneamente toda a base de dados do ginásio numa lista ininterrupta.

### 3.2. Directório Deslizante (Sidebar Esquerda)
*   Listagem em tempo real de todos os alunos retornados pela timeline.
*   Inclui as *tags* de estado (Ativo, Pausado, Bloqueado) e cálculos demográficos rápidos.

### 3.3. Painel de Detalhes Ultra-Compacto (Grid 3 Colunas)
Para evitar que o administrador precise de rolar (fazer scroll) constantemente, a ficha de aluno é dividida em 3 colunas laterais contíguas, visíveis sem cortes:
1.  **Coluna 1 (Perfil & Segurança)**: Mostra Dados Pessoais, Detalhes de Matrícula (categoria, plano) e a **Zona de Perigo** (Pausar, Bloquear, Eliminar).
2.  **Coluna 2 (Financeiro)**: Estatísticas de pagamento resumidas em cartões e a listagem nativa de histórico de pagamentos num quadro rolável independente.
3.  **Coluna 3 (Comunicação)**: Área exclusiva para adição e consulta de Notas/Ocorrências do aluno (com carimbo de data).

---

## 💰 4. Gestão Financeira Inteligente

*   **Validação Constante**: Bloqueios lógicos que impedem o pagamento de valores negativos ou nulos.
*   **Geração de Faturas Via WhatsApp**: Após registrar um pagamento com sucesso, o modal permite a criação de um link direto do WhatsApp (API nativa `wa.me`) com uma mensagem de fatura pronta a enviar.
*   **Relatórios Mensais (Dossier Operacional)**: 
    *   Apresentação do balanço do mês e dos devedores através do modal (padronizado) "Relatório Mensal".
    *   O Administrador pode gerar ficheiros `.xlsx` perfeitamente estruturados e formatados, prontos a entregar à contabilidade.

---

## ⚙️ 5. Operação, Backups e Segurança

*   **Configuração de Backups Manuais e Automáticos**: 
    *   Integração total do *Render Process (App.tsx)* com o *Main Process (main.cjs)* através de **IPC (Inter-Process Communication)**.
    *   Foi implementado um seletor de diretório (`dialog.showOpenDialog`) para permitir ao administrador **escolher a pasta fixa onde quer guardar os seus backups ou exportações**, garantindo flexibilidade total.
    *   Os backups são empacotados num ficheiro ZIP (Base de dados + ficheiros multimédia dos alunos).
*   **Autenticação**: Não exige acesso à nuvem; as credenciais são criptografadas (Hash + Salt).
*   **Licenciamento Interno**: Gestão do período de licença da aplicação validado no arranque.

---

## 🛠️ 6. Stack Tecnológica

*   **Frontend**: React.js 19 + TypeScript + Vite.
*   **Estilização**: TailwindCSS (Customizado de forma a não depender de bibliotecas externas complexas de UI, desenhando componentes "vanilla-style" ultra-rápidos).
*   **Processo Principal (Backend Desktop)**: Electron.js
*   **Base de Dados**: `better-sqlite3` (Processamento síncrono super-rápido).
*   **Manipulação de Arquivos e Zips**: `adm-zip` (Para os backups) e `xlsx` (Para as tabelas e relatórios).

---

## 🚀 7. Fluxos do Sistema

1.  **Arranque (Setup Inicial)**: A primeira vez que a App é aberta, exibe o Modal de Configuração Windows-Style para aceitação de termos.
2.  **Login**: Um ecrã em Split-Screen de alta estética (dark mode ao lado esquerdo com o logo e imagem e entrada à direita).
3.  **Adição de Aluno**: Modal `Nova Matrícula` → Gravação SQLite → Notificação Toast → Atualização Imediata no Grid.
4.  **Encerramento do Mês**: Navegador nas Finanças → Modal Relatório Mensal → Botão "Exportar Excel" → Sistema escolhe a pasta guardada → Geração de XLSX.

---
*Documentação Oficial atualizada (Design macOS/Windows Desktop Mode).*

## 📦 8. Distribuição e Compilação (Build & Release)

Com a chegada da fase **Beta (`1.0.0-beta.1`)**, o sistema está configurado para ser distribuído através de instaladores nativos gerados pelo `electron-builder`.

### 8.1. Configuração do `electron-builder`
O empacotamento é gerido dentro do `package.json` na secção `"build"`. O sistema está otimizado para:
*   **Windows (NSIS)**: Criação de um executável instalador num só clique ou com escolha de diretório. Inclui atalhos automáticos no *Desktop* e *Start Menu*.
*   **macOS**: Geração da aplicação empacotada preparada para o ambiente Apple, utilizando como categoria de base de negócio (`public.app-category.business`).

### 8.2. Scripts de Manutenção e Build
O projeto inclui comandos vitais para lidar com as dependências nativas (como o `better-sqlite3` que requer bindings de C++):
*   `npm run rebuild`: Executa o `electron-rebuild` de forma a recompilar o motor SQLite e outras dependências nativas para a arquitetura alvo (muito útil em transições entre Windows/Mac ou atualizações de Node).
*   `npm run dist`: O comando principal de lançamento. Ele faz o `build` estático do frontend no Vite (para a pasta `dist`) e logo a seguir corre o `electron-builder` gerando os ficheiros de instalação final nas pastas de saída correspondentes.

### 8.3. Gestão de Assets de Lançamento
Todos os ícones de aplicação e recursos necessários para compilação residem na pasta `build/` (ex: `build/icon.png`). Ficheiros públicos gerais (ex: vetor do logotipo da academia) residem em `public/`. Esta separação garante que o instalador final não incorpore ficheiros pesados ou desnecessários.
