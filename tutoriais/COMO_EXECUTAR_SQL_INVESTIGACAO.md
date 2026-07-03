# 🚀 COMO EXECUTAR OS SQL DE INVESTIGAÇÃO NO SUPABASE

## ⚠️ ORDEM CORRETA DE EXECUÇÃO

Você recebeu um erro porque o SQL de policies tentou referenciar tabelas que não existiam.

**Siga esta ordem EXATA:**

---

## **PASSO 1: Criar Tabelas** (PRIMEIRO)

### No Supabase Console:
1. Abrir https://supabase.com/dashboard
2. Selecionar seu projeto **CERCO**
3. Menu esquerdo → **SQL Editor**
4. Clicar em **+ New Query**
5. Copiar **TODO** o conteúdo de: `00_create_investigation_tables.sql`
6. Colar no editor
7. Clicar em **RUN** (ou Ctrl+Enter)

### Esperado:
```
✅ Success. No rows returned
```

Se der erro de "tabela já existe", é normal. Significa que as tabelas já foram criadas antes.

---

## **PASSO 2: Aplicar RLS Policies** (SEGUNDO)

### No Supabase Console:
1. Clicar em **+ New Query** novamente
2. Copiar **TODO** o conteúdo de: `01_rls_investigation_policies.sql`
3. Colar no editor
4. Clicar em **RUN**

### Esperado:
```
✅ Success. No rows returned
```

---

## **PASSO 3: Vincular Prisões** (OPCIONAL - TERCEIRO)

Se quiser relacionar investigações a prisões:

1. Clicar em **+ New Query**
2. Copiar **TODO** o conteúdo de: `08_link_investigation_to_arrest.sql`
3. Colar no editor
4. Clicar em **RUN**

---

## 🔍 VERIFICAR SE FUNCIONOU

Execute estas queries para confirmar:

### Verificar tabelas criadas:
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('investigacoes', 'provas', 'investigacao_auditoria', 'investigacao_notas');
```

Esperado:
```
investigacoes
provas
investigacao_auditoria
investigacao_notas
```

### Verificar RLS ativada:
```sql
SELECT tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('investigacoes', 'provas', 'investigacao_auditoria', 'investigacao_notas')
ORDER BY tablename;
```

Esperado: Lista de policies para cada tabela

---

## ❌ ERROS COMUNS & SOLUÇÕES

### Erro: "relation "investigacoes" does not exist"
**Solução:** Execute PRIMEIRO o `00_create_investigation_tables.sql`

### Erro: "policy "Users can view..." already exists"
**Solução:** É normal se executar 2x. O script remove policies antigas antes de recriar.

### Erro: "permission denied for schema public"
**Solução:** Use conta com permissão (usuário admin do Supabase)

### Erro: "duplicate key value..."
**Solução:** Índices já existem. Seguro ignorar.

---

## 📋 CHECKLIST

- [ ] Executei `00_create_investigation_tables.sql` com sucesso
- [ ] Executei `01_rls_investigation_policies.sql` com sucesso
- [ ] Executei `08_link_investigation_to_arrest.sql` (opcional, se quer prisões)
- [ ] Verifiquei as tabelas usando query acima
- [ ] Verifiquei as policies usando query acima

---

## 🎯 PRÓXIMO PASSO

Após confirmar que tudo foi criado:

1. **Integrar componentes frontend:**
   ```javascript
   import { StatusSelect } from '@/components/StatusSelect';
   import AuditTrailViewer from '@/components/AuditTrailViewer';
   import ProofPagination from '@/components/ProofPagination';
   ```

2. **Testar validação backend:**
   ```bash
   curl -X POST http://localhost:5000/api/investigations \
     -H "Authorization: Bearer TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"titulo": "abc"}' # ❌ Será rejeitado
   ```

3. **Deploy:**
   - Staging primeiro
   - Testar RLS funciona
   - Deploy em produção

---

## 💡 DICA IMPORTANTE

**RLS está ATIVO agora.** Isso significa:
- ✅ User A não consegue ver investigações de User B
- ✅ Mesmo um admin só vê se tiver role correto
- ✅ Todas as queries automáticamente filtram por `auth.uid()`

**ISSO É BOM!** Segurança máxima. 🔐

---

**Executou com sucesso? Ótimo! Você tem o módulo de investigação 100% seguro! 🎉**

Se tiver dúvidas, execute as queries de verificação acima.
