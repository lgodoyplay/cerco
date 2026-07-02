# 🚀 MELHORIAS 9-16: Guia Rápido de Implementação

Criado um sumário com código pronto para copiar/colar em cada melhoria.

---

## **#9 - Refatorar useInvestigations Hook (GRANDE)**

**Problema:** useInvestigations.js tem 600+ linhas, impossível manter.

**Solução:** Dividir em 4 hooks menores:

```javascript
// src/hooks/useInvestigationList.js (150 linhas)
export const useInvestigationList = () => {
  const [investigations, setInvestigations] = useState([]);
  const [filters, setFilters] = useState({ status: 'all', priority: 'all' });
  
  const fetch = async () => {
    const { data } = await supabase
      .from('investigacoes')
      .select('*')
      .match(buildWhereClause(filters));
    setInvestigations(data);
  };
  
  return { investigations, setFilters, loading, error, fetch };
};

// src/hooks/useInvestigationDetail.js (120 linhas)
export const useInvestigationDetail = (id) => {
  const [investigation, setInvestigation] = useState(null);
  
  useEffect(() => {
    supabase.from('investigacoes').select('*').eq('id', id).single();
  }, [id]);
  
  return { investigation, loading, error };
};

// src/hooks/useProofManagement.js (140 linhas)
export const useProofManagement = (investigacaoId) => {
  const addProof = async (file, tipo) => { /* ... */ };
  const deleteProof = async (id) => { /* ... */ };
  const editProof = async (id, descricao) => { /* ... */ };
  
  return { addProof, deleteProof, editProof };
};

// src/hooks/useInvestigationWorkflow.js (100 linhas)
export const useInvestigationWorkflow = (investigacaoId) => {
  const changeStatus = async (novoStatus) => { /* ... */ };
  const finalize = async () => { /* ... */ };
  const archive = async () => { /* ... */ };
  
  return { changeStatus, finalize, archive };
};
```

**Benefício:** Cada hook reutilizável, testável, manutenível.

---

## **#10 - Adicionar Comentários/Notas Internas**

Já temos a tabela `investigacao_notas` no schema. Falta:

```javascript
// src/components/NoteComposer.jsx
export const NoteComposer = ({ investigacaoId, onNoteAdded }) => {
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState([]);
  
  const handleSubmit = async () => {
    // 1. Salvar em investigacao_notas
    const { data } = await supabase.from('investigacao_notas').insert({
      investigacao_id: investigacaoId,
      usuario_id: authUser.id,
      conteudo: content,
      mencoes: mentions,
      criado_em: new Date()
    });
    
    // 2. Se houver menções, enviar notificações
    if (mentions.length) {
      notifyMentionedUsers(mentions, investigacaoId);
    }
    
    onNoteAdded(data);
  };
  
  return (
    <div className="space-y-2">
      <textarea value={content} onChange={e => setContent(e.target.value)} />
      <MentionSelect onChange={setMentions} />
      <button onClick={handleSubmit}>Comentar</button>
    </div>
  );
};
```

**Passo 1:** Criar NoteComposer.jsx
**Passo 2:** Criar NoteThread.jsx (mostrar todos os comentários)
**Passo 3:** Integrar em InvestigationDetail.jsx

---

## **#11 - Timeline Visual**

Combinar audit trail + status changes em uma timeline:

```javascript
// src/components/InvestigationTimeline.jsx
export const InvestigationTimeline = ({ investigacaoId }) => {
  const { logs } = useAuditTrail(investigacaoId);
  
  // Agrupar por data
  const eventsByDate = groupByDate(logs);
  
  return (
    <div className="space-y-6">
      {Object.entries(eventsByDate).map(([date, events]) => (
        <div key={date}>
          <h3 className="font-bold">{date}</h3>
          <div className="border-l-2 border-federal-500 space-y-2">
            {events.map(event => (
              <TimelineEvent key={event.id} event={event} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

**Usa:** AuditTrailViewer já criado

---

## **#12 - Melhorar Formulário de Criação**

Adicionar conditional fields + field groups:

```javascript
// src/components/InvestigationFormBuilder.jsx
export const InvestigationFormBuilder = ({ onSubmit }) => {
  const [category, setCategory] = useState(null);
  
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Seção Básica */}
      <FieldGroup title="Informações Básicas">
        <Input name="titulo" label="Título" required />
        <Select name="prioridade" label="Prioridade" options={getPriorityOptions()} />
        <Select 
          name="categoria" 
          label="Categoria" 
          options={getCategoryOptions()}
          onChange={e => setCategory(e.target.value)}
        />
      </FieldGroup>

      {/* Seção Envolvidos */}
      <FieldGroup title="Pessoas Envolvidas">
        <PersonSearchMultiple name="investigados" />
      </FieldGroup>

      {/* Campos condicionais - Aparecem só se Financial */}
      {category === 'Financeira' && (
        <FieldGroup title="Informações Financeiras">
          <CurrencyInput name="valor_envolvido" label="Valor Envolvido" />
          <Input name="contas_bancarias" label="Contas Bancárias" multiline />
          <Input name="instituicoes" label="Instituições" />
        </FieldGroup>
      )}

      {/* Campos condicionais - Aparecem só se Criminal */}
      {category === 'Criminal' && (
        <FieldGroup title="Informações do Crime">
          <Input name="tipo_crime" label="Tipo de Crime" />
          <Input name="local_crime" label="Local do Crime" />
          <DateInput name="data_crime" label="Data do Crime" />
        </FieldGroup>
      )}

      <button type="submit">Criar Investigação</button>
    </form>
  );
};
```

---

## **#13 - Filtros Avançados + Busca**

```javascript
// src/components/InvestigationFilters.jsx
export const InvestigationFilters = ({ onFilterChange }) => {
  return (
    <div className="space-y-4 p-4 bg-slate-800 rounded-lg">
      {/* Busca texto */}
      <Input 
        placeholder="Buscar por título, descrição, envolvidos..."
        onChange={e => onFilterChange({ search: e.target.value })}
      />

      {/* Filtros */}
      <Select
        label="Status"
        options={getStatusOptions()}
        onChange={e => onFilterChange({ status: e.target.value })}
      />

      <Select
        label="Prioridade"
        options={getPriorityOptions()}
        onChange={e => onFilterChange({ priority: e.target.value })}
      />

      <DateRangePicker
        label="Data de Criação"
        onChange={range => onFilterChange({ dateRange: range })}
      />

      <MultiSelect
        label="Delegacias"
        options={delegacias}
        onChange={selected => onFilterChange({ delegacias: selected })}
      />

      {/* Salvarcomo filtro */}
      <Input 
        placeholder="Salvar este filtro como..."
        button="💾 Salvar"
      />
    </div>
  );
};
```

---

## **#14 - Templates de Investigação**

```javascript
// src/constants/investigationTemplates.js
export const INVESTIGATION_TEMPLATES = {
  trafico_drogas: {
    titulo: 'Investigação de Tráfico de Drogas',
    categoria: 'Criminal',
    prioridade: 'Alta',
    checklist: [
      'Mala/embalagem apreendida?',
      'Amostras coletadas?',
      'DNA/biometria realizada?',
      'Testemunhas identificadas?',
      'Câmeras de vigilância?'
    ],
    campos_adicionais: ['tipo_droga', 'quantidade', 'valor_mercado', 'procedencia']
  },
  fraude_financeira: {
    titulo: 'Investigação de Fraude Financeira',
    categoria: 'Financeira',
    prioridade: 'Alta',
    campos_adicionais: ['valor_envolvido', 'contas_bancarias', 'periodos_transacao']
  }
};

// src/components/TemplateSelector.jsx
export const TemplateSelector = ({ onSelectTemplate }) => {
  return (
    <div className="grid grid-cols-2 gap-4">
      {Object.entries(INVESTIGATION_TEMPLATES).map(([key, template]) => (
        <button
          key={key}
          onClick={() => onSelectTemplate(template)}
          className="p-4 bg-slate-800 rounded-lg hover:bg-slate-700"
        >
          <h4>{template.titulo}</h4>
          <p className="text-sm text-slate-400">{template.categoria}</p>
        </button>
      ))}
    </div>
  );
};
```

---

## **#15 - Bulk Operations**

```javascript
// src/components/InvestigationBulkActions.jsx
export const InvestigationBulkActions = ({ selectedIds }) => {
  const [action, setAction] = useState(null);

  const handleDelete = async () => {
    const confirmDelete = window.confirm(`Deletar ${selectedIds.length} investigações?`);
    if (confirmDelete) {
      for (const id of selectedIds) {
        await supabase.from('investigacoes').delete().eq('id', id);
      }
    }
  };

  const handleChangeStatus = async (novoStatus) => {
    for (const id of selectedIds) {
      await supabase.from('investigacoes').update({ status: novoStatus }).eq('id', id);
    }
  };

  const handleExport = async () => {
    const investigations = await supabase
      .from('investigacoes')
      .select('*')
      .in('id', selectedIds);
    
    downloadAsCSV(investigations.data, 'investigacoes.csv');
  };

  if (selectedIds.length === 0) return null;

  return (
    <div className="sticky bottom-0 bg-slate-800 p-4 flex gap-2">
      <span>{selectedIds.length} selecionadas</span>
      
      <button onClick={handleDelete} className="btn-danger">
        🗑️ Deletar
      </button>

      <Select 
        options={getStatusOptions()} 
        onChange={e => handleChangeStatus(e.target.value)}
      >
        Alterar Status
      </Select>

      <button onClick={handleExport} className="btn-secondary">
        📥 Exportar CSV
      </button>
    </div>
  );
};
```

---

## **#16 - Notificações Automáticas**

```javascript
// src/utils/notifications.js
export const notifyInvestigationCreated = async (investigacao, delegado) => {
  // Discord
  await sendDiscordNotification({
    webhookUrl: process.env.VITE_DISCORD_WEBHOOK,
    message: `📋 Nova investigação criada: ${investigacao.titulo}`,
    creator: investigacao.responsavel,
    priority: investigacao.prioridade
  });

  // Email
  await sendEmail({
    to: delegado.email,
    subject: `Nova Investigação: ${investigacao.titulo}`,
    template: 'investigation_created',
    data: investigacao
  });

  // In-app
  await createNotification({
    usuarioId: delegado.id,
    tipo: 'investigation_created',
    dados: { investigacaoId: investigacao.id }
  });
};

export const notifyProofAdded = async (investigacao, prova) => {
  // Notificar responsável
  await sendDiscordNotification({
    message: `📎 Prova adicionada: ${prova.descricao} em ${investigacao.titulo}`
  });
};

export const notifyInvestigationDueDate = async () => {
  // Executar daily
  const investigacoes30diasAbertas = await supabase
    .from('investigacoes')
    .select('*')
    .eq('status', 'Em Andamento')
    .lte('data_inicio', Date.now() - 30 * 24 * 60 * 60 * 1000);

  investigacoes30diasAbertas.data.forEach(inv => {
    sendDiscordNotification({
      message: `⏰ Investigação aberta há 30 dias: ${inv.titulo}`
    });
  });
};
```

---

## 📊 Matriz de Implementação

| # | Melhoria | Tipo | Esforço | Prioridade | Status |
|---|----------|------|---------|-----------|--------|
| 9 | Refatorar hooks | Backend | 6h | 🟠 | Next |
| 10 | Comentários | Feature | 4h | 🟡 | Later |
| 11 | Timeline | UI | 3h | 🟡 | Later |
| 12 | Formulário | UX | 4h | 🟠 | Next |
| 13 | Filtros | Feature | 5h | 🟠 | Next |
| 14 | Templates | Feature | 3h | 🟢 | Nice |
| 15 | Bulk ops | Feature | 4h | 🟢 | Nice |
| 16 | Notificações | Feature | 5h | 🟢 | Nice |

---

## ✅ Próximos 3 Passos Recomendados

1. **HOJE:** Implementar #9 (Refatorar hooks) - Base para tudo
2. **SEMANA 1:** Implementar #12 (Formulário melhorado) + #13 (Filtros)
3. **SEMANA 2:** Implementar #10 (Comentários) + #11 (Timeline)

Depois disso, o sistema estará 🚀 profissional e escalável!

---

**Precisa de ajuda implementando qualquer uma delas?**
