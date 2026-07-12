# Next Level Academia — Release v1.0.0 (estável)

**Produto:** Next Level Academia  
**Versão:** 1.0.0  
**Estado:** Estável para entrega (Windows-first)  
**Editor:** NEXT LAB · Cabo Verde  
**Data:** 11 de Julho de 2026  

---

## O que se entrega

Sistema desktop **offline-first** para gestão de academias — **versão 1.0.0 estável**:

- Matrícula e CRM de alunos (soft delete, fotos, notas com avatar)
- **2 categorias oficiais:** Sem personal trainer (1000 CVE) · Com personal trainer (2000 CVE) — valores editáveis
- Cobrança por ciclo real (motor `billing.ts`)
- Pagamentos, contactos, WhatsApp de cobrança
- Relatórios admin + **Exportar** unificado (PDF simples / Excel, recorte e ordenação)
- Ciclo de mês: passado em leitura (admin pode desbloquear), boas-vindas ao mês novo
- Utilizadores, roles, setup inicial, licença
- 3 temas (Claro / Escuro / Claude)
- Backup / restore / importação Excel
- Auto-atualização (Windows, quando configurada a origem de releases)

---

## Pré-requisitos no PC do cliente (Windows)

- Windows 10/11 64-bit
- ~200 MB livres + espaço para backups
- Direitos de instalação (setup NSIS) **ou** uso do portable
- Não é necessária internet para o dia-a-dia (só para updates e WhatsApp Web)

---

## Como gerar o instalador (máquina de build)

```bash
# 1. Dependências
npm install
npm run rebuild

# 2. Verificar qualidade mínima
npm run verify

# 3. Instalador Windows (NSIS + portable)
npm run dist:win
```

Artefactos esperados em `release/`:

| Ficheiro | Uso |
|----------|-----|
| `Next Level Academia-Setup-1.0.0.exe` | Instalador recomendado para o cliente |
| `Next Level Academia-1.0.0.exe` | Portable (sem instalação) |
| `latest.yml` | Metadados do auto-updater |

> **Nota macOS:** desenvolvimento e testes nativos funcionam com `npm run start:native`.  
> Instalador macOS oficial/notariado **não** faz parte deste pacote v1.0.0.

### Desenvolvimento nativo (macOS/Windows dev)

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run start:native
```

Vite usa `http://127.0.0.1:3000` por omissão.

---

## Checklist de entrega no cliente (obrigatório)

### Instalação
- [ ] Instalar com o Setup **ou** copiar portable
- [ ] Abrir a app sem ecrã branco / crash
- [ ] Confirmar wizard de setup **ou** login (seed)

### Operação mínima
- [ ] Criar/editar 1 aluno
- [ ] Registar 1 pagamento e ver vencimento atualizado
- [ ] Ver aluno em atraso / em dia corretamente
- [ ] Abrir Contactos e nota
- [ ] Abrir Relatórios e exportar Excel **ou** PDF
- [ ] Backup da base (Configurações)
- [ ] Logout / login

### Dados
- [ ] Confirmar moeda/valores em CVE
- [ ] Confirmar nome da academia no branding
- [ ] (Opcional) Importar Excel de alunos de teste

### Pós-instalação
- [ ] Criar atalho no ambiente de trabalho
- [ ] Explicar pasta de backups
- [ ] Entregar credenciais de admin (fora do repositório)

---

## Credenciais e licença

- Credenciais de demo/admin **não** vão no instalador público em texto.
- Usar o ficheiro de credenciais interno da NEXT LAB (Nexus) e a chave de licença acordada.
- Em bloqueio de licença: ecrã `LicenseBlockedPage` + reativação.

---

## Verificação técnica (desenvolvedor)

```bash
npm test          # testes de domínio
npm run build     # frontend produção
npm run verify    # test + build
```

Módulos nativos após mudar Node/Electron:

```bash
rm -rf node_modules/better-sqlite3/build
npx electron-rebuild -v 31.7.7 -f -w better-sqlite3
```

---

## Limitações conhecidas (transparentes ao cliente se necessário)

1. **Windows-first** — macOS em dev; instalador macOS oficial noutro ciclo.  
2. `App.tsx` ainda concentra orquestração (sem impacto no utilizador final).  
3. Listas muito grandes (&gt;500 alunos) podem merecer virtualização futura.  
4. Auto-updater só em app empacotada Windows com feed de releases configurado.  
5. Alguns módulos UI ainda com tipagem legacy (`@ts-nocheck`) — sem impacto funcional validado.

---

## Rollback

1. Desinstalar a 1.0.0 **ou** parar o portable.  
2. Restaurar backup `.db` anterior (Configurações → backup/restore ou cópia manual de `userData`).  
3. Reinstalar build anterior se necessário.

Caminho típico de dados (Windows):

`%APPDATA%/Next Level Academia/nextlevel.db`

---

## Suporte

**NEXT LAB** · Ivaldino da Luz Fortes  
Email: ivaldinofortes@gmail.com  

---

## Assinatura de release

| Campo | Valor |
|-------|--------|
| Versão | 1.0.0 |
| Canal | stable |
| Plataforma prioritária | Windows x64 |
| Build frontend | `npm run build` ✅ |
| Testes domínio | `npm test` ✅ |

**Pronto para entrega após checklist de cliente marcado.**
