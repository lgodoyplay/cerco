# 🚀 GUIA DE MIGRAÇÃO PARA CLOUD STORAGE (Supabase)

## ✅ FASE 2 COMPLETA - Arquivos Criados

### Backend
1. ✅ `src/utils/supabaseStorage.ts` - Funções para upload/delete em Supabase
2. ✅ `src/controllers/arrest.controller.cloud.ts` - Controller com cloud storage
3. ✅ Atualizar `.env` com credenciais Supabase

### Benefícios do Cloud Storage
```
📊 COMPARAÇÃO

                Disco Local    vs    Supabase Storage
├─ Espaço       Limitado          Ilimitado ♾️
├─ Backup       Manual            Automático ✅
├─ CDN          Não               Global (fast!) ⚡
├─ Custo/mês    $0 (Render)       ~$1-5 📉
├─ Escalabilidade Ruim           Excelente 🚀
└─ Segurança    RLS não           RLS completo 🔒
```

---

## 📋 PASSO-A-PASSO: Configurar Supabase Storage

### 1️⃣ Criar Buckets no Supabase Dashboard

```
Supabase Console > Storage > Create bucket
```

Criar 3 buckets:
- `arrests` (fotos de prisões)
- `wanted` (fotos de procurados)
- `evidence` (evidências de investigações)

**Configuração recomendada para cada bucket:**
- File size limit: 100 MB
- Public: Sim (para CDN)

### 2️⃣ Gerar Service Key

```
Supabase Console > Project Settings > API
```

Copiar:
- `SUPABASE_URL` (Project URL)
- `Service Role Secret` (SUPABASE_SERVICE_KEY)

⚠️ **Nunca compartilhe a Service Key!** Apenas para servidor.

### 3️⃣ Atualizar .env Backend

```bash
# dip-backend/.env

SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGc...xxxxx

# Manter DATABASE_URL como está
DATABASE_URL=postgresql://...
JWT_SECRET=sua_chave
PORT=3000
NODE_ENV=production
```

### 4️⃣ Instalar Dependência

```bash
cd dip-backend
npm install @supabase/supabase-js
```

### 5️⃣ Escolher Implementação

#### Option A: Usar Disco Local (Atual)
- Mantém `src/controllers/arrest.controller.ts`
- Menos configuração
- Funciona em desenvolvimento
- ⚠️ Limitado em produção (Render não persiste disco)

#### Option B: Migrar para Cloud (Recomendado)
- Copiar conteúdo `arrest.controller.cloud.ts` → `arrest.controller.ts`
- Atualizar rota para não usar uploadMiddleware.upload
- Usar apenas Supabase

Exemplo da rota simplificada:
```typescript
// arrest.routes.ts - CLOUD VERSION
router.post('/', uploadMiddleware.upload.fields([...]), arrestController.createArrest);
// multer agora só coloca arquivo em memória, não em disco
```

---

## 🔄 MIGRAR ARQUIVOS EXISTENTES

Se você tem fotos no disco local `/uploads`, migrar para Supabase:

```bash
# Script de migração (Node.js)
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function migrateFiles() {
  const uploadsDir = path.join(__dirname, '../uploads');
  const files = fs.readdirSync(uploadsDir);

  for (const file of files) {
    const filePath = path.join(uploadsDir, file);
    const fileBuffer = fs.readFileSync(filePath);

    // Upload para Supabase
    const { data, error } = await supabase.storage
      .from('arrests')
      .upload(`migrated/${file}`, fileBuffer);

    if (error) {
      console.error(`Erro ao migrar ${file}:`, error);
    } else {
      console.log(`✅ Migrado: ${file}`);
    }
  }
}

migrateFiles();
```

---

## 🧪 TESTAR UPLOAD

### Via cURL
```bash
curl -X POST http://localhost:3000/arrests \
  -H "Authorization: Bearer seu_jwt_token" \
  -F "nomePreso=João Silva" \
  -F "documento=12345678910" \
  -F "motivo=Roubo" \
  -F "artigos=Art 155" \
  -F "data=2026-07-02" \
  -F "fotoRosto=@/path/to/photo.jpg"
```

Resposta esperada:
```json
{
  "message": "✅ Prisão registrada com sucesso no cloud storage",
  "arrest": { ... },
  "imagesCount": 1,
  "storage": "☁️ Supabase (Backup automático)"
}
```

---

## ✨ MELHORIAS FUTURAS (FASE 3)

- [ ] Gerar thumbnails automáticos
- [ ] Progressive image loading (blur hash)
- [ ] Lightbox gallery
- [ ] Offline queue com Service Worker
- [ ] Compressão antes de upload no frontend

---

## 📞 TROUBLESHOOTING

### Erro: "SUPABASE_URL e SUPABASE_SERVICE_KEY obrigatórios"
→ Adicionar ao .env

### Erro: "Bucket not found"
→ Criar bucket no Supabase Console

### Erro: "Permission denied"
→ Verificar RLS policies no Supabase Storage

### Upload lento
→ Imagens são comprimidas para WebP (reduz ~80%)
→ Usar CDN URL direto no frontend

---

## 📊 Monitorar Storage

Supabase Console > Storage > Usar "Analytics" para ver:
- Arquivos totais
- Espaço usado
- Transferências/mês
- Custo estimado
