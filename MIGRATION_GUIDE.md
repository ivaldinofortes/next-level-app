# 🚀 Guia de Migração - Refatoração de App.tsx

## 📋 Visão Geral

O arquivo `App.tsx` com 8.336 linhas será dividido em múltiplos arquivos seguindo a nova arquitetura.

**Objetivo**: Cada componente < 500 linhas com responsabilidade única.

## 🔄 Fases de Migração

### Fase 1: Preparação (✅ Completa)
- [x] Criar estrutura de pastas
- [x] Criar types centralizadas
- [x] Criar constants centralizadas
- [x] Criar IPCService
- [x] Criar custom hooks
- [x] Criar componentes base (Dialog, UI)

### Fase 2: Dividir App.tsx (⏳ Próxima)
- [ ] Criar página: StudentsList
- [ ] Criar página: StudentDetails
- [ ] Criar página: Billing
- [ ] Criar página: Payments
- [ ] Criar página: Reports
- [ ] Criar página: Settings
- [ ] Criar AppShell (layout principal)
- [ ] Refatorar App.tsx para usar novas páginas

### Fase 3: Refatorar Backend (⏳ Fila)
- [ ] Dividir main.cjs em handlers
- [ ] Implementar repositories
- [ ] Criar serviços de negócio

### Fase 4: Testes (⏳ Fila)
- [ ] Unit tests para hooks
- [ ] Unit tests para utils
- [ ] Integration tests
- [ ] e2e tests

---

## 📊 Estrutura de App.tsx Atual

```
App.tsx (8.336 linhas)
├── Estados (30+ useState)
├── Constantes (hardcoded)
├── Helpers (150+ funções)
├── Componente principal
├── Diálogos
├── Seções
│   ├── DirectoryView
│   ├── BillingView
│   ├── ReportsView
│   └── ...
└── Modals
    ├── ImportModal
    └── ...
```

---

## 🎯 Estrutura Alvo

```
src/pages/
├── StudentsList.tsx       (300-400 linhas)
├── StudentDetails.tsx     (300-400 linhas)
├── Billing.tsx            (300-400 linhas)
├── Payments.tsx           (200-300 linhas)
├── Reports.tsx            (200-300 linhas)
└── Settings.tsx           (150-200 linhas)

src/layout/
└── AppShell.tsx           (100-150 linhas)

src/App.tsx               (50-100 linhas - router only)
```

---

## 📝 Checklist de Refatoração

### Para cada página a ser criada:

- [ ] Criar arquivo `src/pages/[Name].tsx`
- [ ] Identificar states necessários do App.tsx
- [ ] Converter para custom hooks
- [ ] Extrair constantes para `constants/`
- [ ] Importar types de `types/`
- [ ] Usar IPCService para chamadas
- [ ] Remover inline functions → utils/
- [ ] Adicionar error handling
- [ ] Testar renderização
- [ ] Remover código de App.tsx

---

## 🔨 Exemplo: Refatoring de StudentsList

### Antes (em App.tsx):

```tsx
// App.tsx (trecho)
const [students, setStudents] = useState<any[]>([]);
const [studentFilter, setStudentFilter] = useState<DirectoryFilterStatus>('todos');
const [studentSort, setStudentSort] = useState<StudentSortMode>('inteligente');
const [directorySearchInput, setDirectorySearchInput] = useState('');
const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
const [editingStudent, setEditingStudent] = useState<any | null>(null);

// 100+ linhas de lógica misturada
useEffect(() => {
  loadStudents();
}, []);

const loadStudents = async () => {
  setLoading(true);
  try {
    const data = await electron.ipcRenderer.invoke('get-alunos');
    setStudents(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Renderização gigante
return (
  <div>
    {/* 500+ linhas de JSX */}
  </div>
);
```

### Depois (novo arquivo):

```tsx
// src/pages/StudentsList.tsx

import React, { useState } from 'react';
import { useStudents } from '../hooks';
import { PageHeader, Loading, ErrorAlert } from '../components/UI';
import { DirectoryFilterStatus, StudentSortMode } from '../types';

export const StudentsList: React.FC = () => {
  const { students, loading, error, deleteStudent } = useStudents();
  
  // Apenas estados específicos dessa página
  const [filterStatus, setFilterStatus] = useState<DirectoryFilterStatus>('todos');
  const [sortMode, setSortMode] = useState<StudentSortMode>('inteligente');
  const [searchInput, setSearchInput] = useState('');

  // Lógica separada
  const filteredStudents = filterStudents(students, filterStatus, searchInput);
  const sortedStudents = sortStudents(filteredStudents, sortMode);

  if (loading) return <Loading />;

  return (
    <div>
      <PageHeader 
        title="Diretório de Alunos"
        subtitle={`${students.length} alunos`}
        action={{ label: 'Novo Aluno', onClick: () => {} }}
      />
      
      {error && <ErrorAlert message={error} />}
      
      {/* Renderização focada */}
      <div className="space-y-4">
        {sortedStudents.map(student => (
          <StudentCard key={student.id} student={student} onDelete={deleteStudent} />
        ))}
      </div>
    </div>
  );
};

// Funções puras
const filterStudents = (students: any[], status: DirectoryFilterStatus, search: string) => {
  // ...
};

const sortStudents = (students: any[], mode: StudentSortMode) => {
  // ...
};
```

---

## 🎓 Aprendizados

### ✅ O que fazer:

1. **One Responsibility**: Uma página = um conceito (Students, Billing, etc)
2. **Custom Hooks**: Reutilizar lógica com `useStudents`, `usePayments`
3. **Types First**: Sempre importar tipos centralizados
4. **Constants**: Nunca hardcode
5. **Pure Functions**: Funções helper devem ser puras
6. **Error Handling**: Try-catch em toda operação async

### ❌ O que NÃO fazer:

1. Misturar conceitos (Alunos + Pagamentos numa página)
2. IPC calls espalhadas → sempre usar IPCService
3. Props drilling excessivo → usar Context se necessário
4. Constantes hardcoded → centralizar em `constants/`
5. Estados globais não mapeados → usar custom hooks

---

## 🧪 Teste Rápido

Após criar uma página, verificar:

```bash
# 1. Build sem erros
npm run build

# 2. TypeScript sem erros
npx tsc --noEmit

# 3. ESLint sem erros
npm run lint
```

---

## 📞 Questões Frequentes

**P: E se eu precisar de estado compartilhado entre páginas?**
R: Use Context API ou biblioteca como Zustand/Redux.

**P: Como organizar componentes muito pequenos?**
R: Agrupe em `components/[Feature]/` (ex: `components/StudentCard/`)

**P: E o theme/dark mode?**
R: Mover para Context em `src/context/ThemeContext.tsx`

**P: Quando começar testes?**
R: Imediatamente após cada página refatorada.

---

## ✨ Resultado Final

```
App.tsx: 8.336 linhas → 50-100 linhas (router only)
main.cjs: 1.338 linhas → 300 linhas (delegando para handlers)
Total modularizado: ~15 arquivos < 500 linhas cada
Type safety: 100%
Testabilidade: ⬆️⬆️⬆️
Manutenibilidade: ⬆️⬆️⬆️
```
