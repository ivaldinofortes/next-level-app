# Entrega ao cliente — Next Level Academia v1.0.0

## Pacote a enviar

Enviar **um** destes ficheiros (pasta `release/`):

| Ficheiro | Recomendado para |
|----------|------------------|
| **`Next Level Academia-Setup-1.0.0.exe`** | Instalação normal (atalhos, desinstalador) |
| `Next Level Academia-1.0.0.exe` | Portable (USB / sem privilégios de admin) |

Opcional para suporte técnico: `docs/RELEASE_v1.0.0.md` (checklist de instalação).

## Passos no PC do cliente

1. Copiar o `.exe` (Setup) para o ambiente de trabalho.  
2. Executar o instalador e seguir o assistente.  
3. Abrir **Next Level Academia**.  
4. Completar setup inicial **ou** login com as credenciais fornecidas pela NEXT LAB.  
5. Percorrer o checklist de `RELEASE_v1.0.0.md` (aluno, pagamento, relatório, backup).  
6. Configurar nome/logo da academia em **Ajustes**.

## Credenciais

Não enviar passwords no chat ou repositório público.  
Usar o ficheiro interno de credenciais da NEXT LAB (Nexus) e a licença do contrato.

## Suporte pós-entrega

- Backup da base: Configurações → exportar/backup  
- Dados Windows: `%APPDATA%\Next Level Academia\nextlevel.db`  
- Contacto: ivaldinofortes@gmail.com · NEXT LAB

## Versão

- **1.0.0** — canal **estável** de produção, Windows x64  
- Gerado com `npm run dist:win` após `npm run verify`  
- Documentação técnica de release: `docs/RELEASE_v1.0.0.md`

### O que o cliente deve saber (v1)
1. Trabalho **100% offline** no dia-a-dia.  
2. Matrícula: escolher *Sem* ou *Com personal trainer* (valores sugeridos 1000 / 2000 CVE, editáveis).  
3. **Relatórios** (admin): botão laranja **Exportar** na barra superior → PDF ou Excel.  
4. Meses **passados** na régua ficam em leitura; o admin pode desbloquear se precisar corrigir.  
5. Fazer **backup ZIP** com regularidade (Ajustes → Dados & Backup).
