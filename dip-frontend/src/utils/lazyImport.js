// Utilitário para lidar com erros de carregamento de chunks (lazy loading)
// Isso acontece frequentemente após um novo deploy, quando o navegador tenta buscar
// um arquivo JS antigo que não existe mais no servidor.

export const lazyImport = (importFunc) => {
  return new Promise((resolve, reject) => {
    importFunc()
      .then(resolve)
      .catch((error) => {
        // Verifica se é um erro de carregamento de chunk
        const isChunkLoadError = 
          error.message?.includes('Failed to fetch dynamically imported module') ||
          error.message?.includes('Importing a module script failed') ||
          error.name === 'ChunkLoadError';

        if (isChunkLoadError) {
          // Verifica se já tentamos recarregar para evitar loop infinito
          const storageKey = `retry-chunk-${window.location.pathname}`;
          const hasRetried = sessionStorage.getItem(storageKey);

          if (!hasRetried) {
            console.log('Chunk load error detected, reloading page...', error);
            sessionStorage.setItem(storageKey, 'true');
            window.location.reload();
            return;
          }
        }
        
        // Se não for erro de chunk ou já tivermos tentado recarregar, rejeita o erro
        // para que o ErrorBoundary possa capturá-lo
        console.error('Lazy import failed:', error);
        reject(error);
      });
  });
};
