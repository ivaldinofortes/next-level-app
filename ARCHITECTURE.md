# 📐 Next Level Academia - Arquitetura Refatorada

## 📁 Estrutura do Projeto

```
next-level-app/
├── src/                          # Frontend React
│   ├── components/               # Componentes React reutilizáveis
│   │   └── Dialog.tsx           # Diálogos e mensagens
│   │
│   ├── hooks/                    # Custom React Hooks
│   │   └── index.ts             # useStudents, usePayments, useAsync, etc.
│   │
│   ├── services/                 # IPC e serviços
│   │   └── ipc.ts               # IPCService - camada unificada de comunicação
│   │
│   ├── types/                    # TypeScript types centralizados
│   │   └── index.ts             # Student, Payment, BillingSummary, etc.
│   │
│   ├── constants/                # Constantes da aplicação
│   │   └── index.ts             # PAYMENT_METHOD_OPTIONS, MONTH_OPTIONS, etc.
│   │
│   ├── utils/                    # Funções utilitárias
│   │   └── formatting.ts         # formatInputDate, getPaymentMethodMeta, etc.
│   │
│   ├── layout/                   # Componentes de layout
│   ├── pages/                    # Páginas principais
│   ├── lib/                      # Lógica de negócio (ex: billing.ts)
│   │
│   ├── App.tsx                   # ⚠️ SERÁ REFATORADO: dividido em páginas
│   ├── main.tsx
│   └── index.css
│
├── electron/                     # Backend Electron
│   ├── models/
│   │   └── repositories.ts       # RepositoryFactory, StudentRepository, etc.
│   │
│   ├── services/                 # Serviços backend
│   │   └── [em desenvolvimento]
│   │
│   ├── handlers/                 # IPC Handlers
│   │   └── [em desenvolvimento]
│   │
│   ├── main.cjs                  # ⚠️ SERÁ REFATORADO: dividir lógica
│   └── preload.cjs
│
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 🏗️ Padrões de Arquitetura

### 1. **Separação de Responsabilidades**

#### Frontend (React)
- **`components/`**: Componentes React puros e reutilizáveis
- **`hooks/`**: Lógica reutilizável com estado
- **`services/`**: Comunicação com backend (IPCService)
- **`types/`**: Contratos TypeScript
- **`constants/`**: Dados imutáveis
- **`utils/`**: Funções puras e auxiliares

#### Backend (Electron)
- **`models/`**: Repository Pattern para acesso a dados
- **`services/`**: Lógica de negócio
- **`handlers/`**: IPC handlers (controladores)

### 2. **IPC Service Layer**

**❌ Antes (Anti-padrão)**:
```tsx
// Espalhado em App.tsx
const students = await electron.ipcRenderer.invoke('get-alunos');
const payments = await electron.ipcRenderer.invoke('get-pagamentos');
```

**✅ Depois (Padrão)**:
```tsx
import { IPCService } from '../services/ipc';

const students = await IPCService.getStudents();
const payments = await IPCService.getPayments();
```

### 3. **Custom Hooks para Estado**

**❌ Antes (Anti-padrão)**:
```tsx
// 30+ useState em App.tsx
const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
// ... repetido 30 vezes
```

**✅ Depois (Padrão)**:
```tsx
const { students, loading, error, addStudent } = useStudents();
const { payments, registerPayment } = usePayments();
```

### 4. **Types Centralizados**

**❌ Antes**: Types espalhadas ou implícitas
**✅ Depois**: Tudo em `src/types/index.ts`

```tsx
import { Student, Payment, BillingSummary } from '../types';
```

### 5. **Constantes Centralizadas**

**❌ Antes**: Constantes hardcoded em componentes
**✅ Depois**: Centralizadas em `src/constants/index.ts`

```tsx
import { PAYMENT_METHOD_OPTIONS, MONTH_OPTIONS } from '../constants';
```

## 🔄 Fluxo de Dados

```
┌─────────────┐
│ React UI    │
└──────┬──────┘
       │ usa
       ↓
┌──────────────────┐
│ Custom Hooks     │ (useStudents, usePayments)
└──────┬───────────┘
       │ chama
       ↓
┌──────────────────┐
│ IPCService       │ (camada única de comunicação)
└──────┬───────────┘
       │ invoca
       ↓
┌──────────────────┐
│ IPC Handlers     │ (main.cjs)
└──────┬───────────┘
       │ usa
       ↓
┌──────────────────┐
│ Repositories     │ (StudentRepository, PaymentRepository)
└──────┬───────────┘
       │ acessa
       ↓
┌──────────────────┐
│ SQLite Database  │
└──────────────────┘
```

## ✅ Benefícios

| Antes | Depois |
|-------|--------|
| App.tsx: 8.336 linhas | App.tsx refatorado em ~10 arquivos menores |
| Sem tipos centralizados | Types reutilizáveis e type-safe |
| IPC disperso | IPCService centralizado |
| main.cjs: 1.338 linhas | Dividido em repositories e handlers |
| 30+ useState | 3-4 hooks customizados |
| Sem testes | Pronto para unit tests |
| Acoplamento alto | Baixo acoplamento |

## 🛠️ Próximos Passos

1. **Extrair componentes de App.tsx**
   - StudentsList
   - PaymentsSection
   - ReportsSection
   - SettingsPanel

2. **Criar IPC Handlers em `electron/handlers/`**
   - student.handler.ts
   - payment.handler.ts
   - auth.handler.ts

3. **Dividir main.cjs**
   - Usar repositories
   - Registar handlers organizados

4. **Implementar testes**
   - Jest para hooks
   - Vitest para utils
   - Playwright para e2e

5. **Code-splitting e lazy loading**
   - Dynamic imports para componentes pesados
   - Reduzir bundle size

## 📚 Exemplo: Usando a Nova Arquitetura

```tsx
// components/StudentList.tsx
import { useStudents } from '../hooks';
import { Student } from '../types';

export const StudentList = () => {
  const { students, loading, error, deleteStudent } = useStudents();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      {students.map(student => (
        <StudentCard key={student.id} student={student} onDelete={deleteStudent} />
      ))}
    </div>
  );
};
```

## 📖 Referências

- [Repository Pattern](https://martinfowler.com/eaaCatalog/repository.html)
- [Custom Hooks React](https://react.dev/learn/reusing-logic-with-custom-hooks)
- [Electron Security](https://www.electronjs.org/docs/tutorial/security)
- [TypeScript Best Practices](https://www.typescriptlang.org/docs/handbook/)
