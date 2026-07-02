# Melhorias na Geração de PDF

## Arquivos Modificados

### 1. `pdfBase.js` (NOVO)
Módulo base com funcionalidades compartilhadas:
- **Cache de imagens** - Evita recarregar imagens já processadas
- **Timeout otimizado** - 2 segundos (era 5) para carregamento de imagens
- **Redimensionamento automático** - Imagens grandes são redimensionadas
- **Compressão adaptativa** - Qualidade varia conforme tamanho da imagem
- **Validação de campos** - `validateRequiredFields()` verifica dados obrigatórios
- **Formatação de data** - `formatDate()` com tratamento de erros
- **Escape HTML** - `escapeHtml()` para segurança
- **Loading state** - `generatePDFWithLoading()` para feedback visual

### 2. `pdf.js`
Refatorado para re-exportar do `pdfBase.js` (manutenção de compatibilidade)

### 3. `pdfGenerator.js`
Refatorado com:
- Funções auxiliares compartilhadas (`drawHeader`, `drawFooter`, `checkPageBreak`)
- Validação de entrada com `validateRequiredFields`
- Mensagens de erro mais claras
- Configurações centralizadas (margens, fontes, tamanhos)

### 4. `pdfGeneratorPro.js`
Refatorado com:
- Importação do módulo base
- Estilo `signatureLine` adicionado
- `documentInfo` adicionado ao PDF (título, autor, assunto)
- Função `generateProfessionalPDF` com parâmetros de options
- Melhor tratamento de erros

### 5. `BotaoPDF.jsx`
Atualizado com:
- Estado de loading (`isGenerating`)
- Botão de visualização (`Eye` icon) - abre PDF no navegador
- Botão de download (`Download` icon) - baixa o arquivo
- Desabilitação durante geração

### 6. `index.css`
Estilos adicionados para preview de PDF:
- `.pdf-preview-page` - Container da página
- `.pdf-preview-cover-page` - Capa com gradiente
- `.pdf-preview-page-header` - Cabeçalho
- `.pdf-preview-page-content` - Conteúdo
- `.pdf-preview-page-footer` - Rodapé

## Como Usar

### PDF Básico (pdfMake)
```javascript
import { gerarPDF, generatePDFWithLoading } from '../utils/pdfBase';

// Com loading state
await generatePDFWithLoading(async () => {
    gerarPDF(docDefinition, 'arquivo.pdf');
}, setLoading);

// Apenas download
gerarPDF(docDefinition, 'arquivo.pdf');

// Visualizar no navegador
gerarPDF(docDefinition, 'arquivo.pdf', { open: true });
```

### PDF Profissional
```javascript
import { generateProfessionalPDF } from '../utils/pdfGeneratorPro';

await generateProfessionalPDF(data, user, templateStr, type, {
    layoutConfig: {},
    pageHeaderConfig: {},
    coverConfig: {},
    coverTemplate: '',
    investigationNumberConfig: {}
});
```

### PDF com jsPDF
```javascript
import { generateInvestigationPDF, generateBOReportPDF, generateArrestPDF, generateWantedPDF } from '../utils/pdfGenerator';

generateInvestigationPDF(investigation, user);
generateBOReportPDF(bo, user);
generateArrestPDF(arrest, user);
generateWantedPDF(person, user);
```

## Principais Melhorias

| Recurso | Antes | Depois |
|---------|-------|--------|
| Cache de imagens | Não existia | Sim (Map) |
| Timeout imagem | 5 segundos | 2 segundos |
| Redimensionamento | Não | Automático (max 800x600) |
| Compressão | Fixa 0.7 | Adaptativa (0.6-0.8) |
| Validação | Nenhuma | `validateRequiredFields` |
| Loading state | Não | Sim (com loading) |
| Visualização | Não | Sim (opção `open`) |
| Metadata PDF | Não | Sim (documentInfo) |
| Estilo signatureLine | Faltando | Adicionado |
| Código duplicado | Muitas repetições | Refatorado |