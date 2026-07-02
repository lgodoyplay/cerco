/**
 * ESTRATÉGIA DE ARQUITETURA - INVESTIGAÇÕES
 * Análise e Recomendação
 */

# 🏗️ Análise: Prisma vs Supabase

## Status Atual

### ❌ Problema Identificado
```
Backend:  Express + Prisma (implementado, mas não usado)
Frontend: React + Supabase direto (único de facto)
Resultado: Duplicação + Schema desincronizado + Sem validação centralizada
```

### Frontend atualmente:
```javascript
// dip-frontend/src/hooks/useInvestigations.js - 600+ linhas
const { data, error } = await supabase
  .from('investigacoes')
  .select('*')
  .order('created_at', { ascending: false });
```

### Backend existente mas não usado:
```typescript
// dip-backend/src/controllers/investigation.controller.ts
export const listInvestigations = async (req, res) => {
  // Nunca é chamado do frontend!
};
```

---

## 🎯 Duas Estratégias Possíveis

### **Opção A: Unificar em Backend (RECOMENDADO) ⭐**

#### Arquitetura:
```
Frontend (React)
    ↓ HTTP API
Backend (Express + Prisma)
    ↓ ORM
PostgreSQL (Supabase)
```

#### Benefícios:
✅ Validação centralizada (já implementada)
✅ Segurança (RLS policies + backend checks)
✅ Fácil manutenção (uma source de truth)
✅ Escalável (cache, jobs assíncronos)
✅ Auditoria (logs centralizados)
✅ Reuso de código (mesmo validation em múltiplos clientes)

#### Custo:
⏱️ 6-8 horas de refatoração
🔌 Remover dependência de Supabase JS do frontend

#### Exemplo pós-migração:
```javascript
// Frontend - Usar API
const response = await fetch('/api/investigations', {
  headers: { Authorization: `Bearer ${token}` }
});
const investigations = await response.json();

// Backend - Validação centralizada
app.get('/api/investigations', authenticateToken, async (req, res) => {
  const investigations = await prisma.investigation.findMany({
    where: { created_by: req.user.id },
    include: { investigador: true }
  });
  res.json(investigations);
});
```

---

### **Opção B: Manter Supabase (Rápido, Menor Refatoração)**

#### Arquitetura:
```
Frontend (React) ←→ Supabase
Backend (Express) ← Opcional para bulk jobs
```

#### Benefícios:
✅ Sem refatoração urgente
✅ Já funciona
✅ Frontend é independente

#### Problemas:
❌ Validação espalhada (frontend + Supabase)
❌ Difícil adicionar lógica complexa
❌ RLS é apenas acesso, não validação
❌ Sem centralized logging/auditoria
❌ Difícil reusar lógica em outros clientes (mobile, CLI, etc)

#### Exemplo (continua frágil):
```javascript
// Frontend - Validação parcial
if (!titulo || titulo.length < 5) {
  // Error...
}

// Supabase RLS - Apenas acesso
CREATE POLICY "Users see own investigations" 
ON investigacoes FOR SELECT
USING (auth.uid() = created_by);
// Não valida dados!
```

---

## ✅ RECOMENDAÇÃO FINAL

### **Implementar Opção A: Unificar em Backend**

### Por quê?
1. **Segurança**: Validação não pode ser bypassada
2. **Escalabilidade**: Backend pode processar dados pesados (relatórios, análises)
3. **Conformidade**: Auditoria centralizada (requisito legal em investigações)
4. **Manutenção**: Uma fonte de verdade
5. **Padrão**: Segue best practices de arquitetura (backend como API)

### Plano de Migração (8 horas)

#### Fase 1: Endpoints Backend (2h)
- [x] createInvestigation + validação ✅
- [x] updateInvestigation + validação ✅
- [x] addEvidence + validação ✅
- [ ] TODO: deleteInvestigation
- [ ] TODO: listInvestigations com filtros
- [ ] TODO: Endpoints de provas (editar, deletar)
- [ ] TODO: Endpoints de notas (criar, editar, deletar)

#### Fase 2: Atualizar Frontend (3h)
Converter hooks de Supabase para chamadas HTTP

Antes:
```javascript
const { data } = await supabase.from('investigacoes').select('*');
```

Depois:
```javascript
const response = await fetch('/api/investigations', {
  headers: { Authorization: `Bearer ${token}` }
});
const data = await response.json();
```

#### Fase 3: Testes + Deploy (1h)
- [ ] Testar todos os endpoints
- [ ] Verificar validações
- [ ] Testar RLS + backend permissions
- [ ] Deploy em staging

#### Fase 4: Cleanup (2h)
- [ ] Remover código Supabase do frontend
- [ ] Remover @supabase/supabase-js se não usado por outros módulos
- [ ] Documentar mudanças
- [ ] Treinamento

---

## 🚀 Implementação (Se Escolher Opção A)

### Passo 1: Endpoints Backend Restantes

```typescript
// DELETE investigação
export const deleteInvestigation = async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = (req as any).user.id;

  const investigation = await prisma.investigation.findUnique({ where: { id } });
  if (!investigation) return res.status(404).json({ error: 'Não encontrada' });

  // Verificar permissão
  if (investigation.investigadorId !== userId) {
    return res.status(403).json({ error: 'Sem permissão' });
  }

  // Deletar cascata
  await prisma.evidence.deleteMany({ where: { investigacaoId: id } });
  await prisma.investigation.delete({ where: { id } });

  await createAuditLog(null, parseInt(id), userId, 'deletado', investigation, null);
  res.json({ message: 'Investigação deletada' });
};

// LIST com filtros e paginação
export const listInvestigations = async (req: Request, res: Response) => {
  const { status, priority, page = 1, limit = 20, search } = req.query;
  const userId = (req as any).user.id;

  const where: any = {
    investigadorId: userId
  };

  if (status) where.status = status;
  if (priority) where.prioridade = priority;
  if (search) {
    where.OR = [
      { titulo: { contains: search, mode: 'insensitive' } },
      { descricao: { contains: search, mode: 'insensitive' } }
    ];
  }

  const [investigations, total] = await Promise.all([
    prisma.investigation.findMany({
      where,
      include: { investigador: { select: { nome: true } } },
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      orderBy: { createdAt: 'desc' }
    }),
    prisma.investigation.count({ where })
  ]);

  res.json({
    data: investigations,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / Number(limit))
    }
  });
};
```

### Passo 2: Hooks Frontend (Novo)

```javascript
// src/hooks/useInvestigationsAPI.js
import { useCallback, useState } from 'react';

export const useInvestigationsAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    try {
      setLoading(true);
      const response = await fetch(`/api${endpoint}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      });

      if (!response.ok) throw new Error(response.statusText);
      return await response.json();
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    listInvestigations: (filters) => 
      apiCall(`/investigations?${new URLSearchParams(filters)}`),
    createInvestigation: (data) => 
      apiCall('/investigations', { method: 'POST', body: JSON.stringify(data) }),
    updateInvestigation: (id, data) => 
      apiCall(`/investigations/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    addEvidence: (id, formData) => 
      apiCall(`/investigations/${id}/provas`, { 
        method: 'POST',
        body: formData,
        headers: {} // Content-Type será auto
      }),
    deleteInvestigation: (id) => 
      apiCall(`/investigations/${id}`, { method: 'DELETE' }),
    loading,
    error
  };
};
```

### Passo 3: Usar no Componente

```javascript
// Antes:
const { data } = await supabase.from('investigacoes').select('*');

// Depois:
const { listInvestigations, loading } = useInvestigationsAPI();
const investigations = await listInvestigations({ status: 'Em Andamento' });
```

---

## 📋 Checklist de Decisão

Responda para decidir:

- [ ] Você quer segurança máxima? → **Opção A**
- [ ] Você quer implementar auditoria legal? → **Opção A**
- [ ] Você quer escalabilidade? → **Opção A**
- [ ] Você quer manter Supabase como único "banco"? → **Opção B**
- [ ] Você tem pressa? → **Opção B** (mas cursando)

---

## 🎬 Recomendação Final do Copilot

### **Use OPÇÃO A (Backend)**

Justificativa: CERCO é um sistema de investigação criminal/financeira. Precisa de:
- ✅ Auditoria (quem acessou/modificou cada caso?)
- ✅ Validação rigorosa (não pode haver inconsistências)
- ✅ Escalabilidade (lidar com 1000s de casos)
- ✅ Integrações futuras (APIs externas, webhooks)

Tudo isso é **muito mais fácil com backend centralizado**.

---

## 📌 Próximo Passo

Se você escolher Opção A:
1. Vou continuar implementando os endpoints restantes
2. Vou refatorar o frontend para usar a API
3. Vou integrar RLS + validação backend

Se você escolher Opção B:
1. Vou pular para #5 (Paginação no frontend)

**Qual prefere?** 🚀
