# Texto para o GitHub Release — v1.0.0

Usa isto em: https://github.com/ivaldinofortes/next-level-app/releases/new

---

## Campos do formulário

| Campo | Valor |
|--------|--------|
| **Choose a tag** | Cria `v1.0.0` (target: `main`) |
| **Release title** | `Next Level Academia v1.0.0` |
| **Set as the latest release** | ✅ Sim |
| **Set as a pre-release** | ❌ Não (é estável) |

### Body (descrição) — copiar abaixo

```markdown
## Next Level Academia **v1.0.0** — estável

Primeira versão de **produção** do sistema de gestão para academias.  
Offline-first · Desktop (Electron) · NEXT LAB · Cabo Verde 🇨🇻

### Destaques
- **Login rápido** com avatares e logo da academia
- **Matrícula** com 2 categorias: *Sem personal trainer* (1000 CVE) e *Com personal trainer* (2000 CVE) — valores editáveis
- **Alunos**: lista, régua de meses, notas (post-it) com foto/iniciais
- **Relatórios** (admin): exportação unificada **PDF / Excel** na barra superior
- **Ciclo de mês**: passado em leitura (admin pode desbloquear); boas-vindas ao mês novo
- **Ajustes** organizados, 3 temas, backup ZIP, importação Excel, WhatsApp de cobrança
- Instalação com **wizard** guiado (conhecer o app passo a passo)

### Requisitos
- **Windows 10/11** 64-bit (entrega principal)
- ~200 MB livres + espaço para backups
- Internet **não** é necessária no dia-a-dia

### Como instalar (cliente)
1. Descarregar o instalador **Setup** (recomendado) ou o **portable**
2. Instalar / abrir a app
3. Completar o setup inicial **ou** fazer login
4. Configurar nome e logo em **Ajustes**
5. Fazer um **backup** após a primeira configuração

### Documentação
- [Guia de release](../blob/main/docs/RELEASE_v1.0.0.md)
- [Entrega ao cliente](../blob/main/docs/ENTREGA_CLIENTE.md)
- [README](../blob/main/README.md)

### Notas de build
- Versão do pacote: `1.0.0` (`package.json`)
- Commit: `main` (inclui wizard de instalação e fluxos v1)
- macOS: desenvolvimento com `npm run start:native` (instalador notariado não incluído neste pacote)

### Suporte
**NEXT LAB** · Ivaldino da Luz Fortes  
📧 ivaldinofortes@gmail.com
```

---

## Anexos (opcional mas recomendado)

Se já tiveres os binários em `release/` (gerados com `npm run dist:win` num PC Windows):

| Ficheiro | Descrição |
|----------|-----------|
| `Next Level Academia-Setup-1.0.0.exe` | Instalador (principal) |
| `Next Level Academia-1.0.0.exe` | Portable |
| `latest.yml` | Auto-updater (se usares) |

> Neste Mac só há build **mac zip** em `release/`. O instalador **Windows** deve ser gerado em Windows com `npm run dist:win` e depois anexado ao release.

### Gerar Windows (no PC Windows)

```bash
npm install
npm run rebuild
npm run verify
npm run dist:win
```

Depois arrasta os `.exe` da pasta `release/` para a área **Attach binaries** no GitHub.
