import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * ProofPagination - Componente para paginar provas
 * Uso: <ProofPagination proofs={allProofs} renderProof={<ProofCard />} />
 */
export const ProofPagination = ({
  proofs = [],
  renderProof,
  proofsPerPage = 10,
  onProofsChange = null
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular paginação
  const totalPages = Math.ceil(proofs.length / proofsPerPage);
  const startIndex = (currentPage - 1) * proofsPerPage;
  const endIndex = startIndex + proofsPerPage;
  const currentProofs = proofs.slice(startIndex, endIndex);

  // Chamar callback se mudou a página
  React.useEffect(() => {
    if (onProofsChange) {
      onProofsChange(currentProofs, currentPage, totalPages);
    }
  }, [currentPage, currentProofs, totalPages]);

  if (proofs.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Nenhuma prova adicionada ainda</p>
      </div>
    );
  }

  const handlePrevious = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePageClick = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-4">
      {/* Conteúdo paginado */}
      <div className="space-y-3">
        {currentProofs.map((proof, index) =>
          renderProof(proof, startIndex + index)
        )}
      </div>

      {/* Controles de paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
          {/* Info */}
          <span className="text-sm text-slate-400">
            {startIndex + 1}-{Math.min(endIndex, proofs.length)} de {proofs.length}
          </span>

          {/* Botões */}
          <div className="flex items-center gap-2">
            {/* Anterior */}
            <button
              onClick={handlePrevious}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>

            {/* Números das páginas */}
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(page => {
                  // Mostrar primeira, última e próximas/anteriores da atual
                  if (page === 1 || page === totalPages) return true;
                  if (page >= currentPage - 1 && page <= currentPage + 1) return true;
                  return false;
                })
                .map((page, idx, arr) => (
                  <React.Fragment key={page}>
                    {/* Mostrar "..." se houver gap */}
                    {idx > 0 && page - arr[idx - 1] > 1 && (
                      <span className="px-2 text-slate-400">...</span>
                    )}

                    <button
                      onClick={() => handlePageClick(page)}
                      className={`w-8 h-8 rounded-lg font-medium text-sm transition-all ${
                        page === currentPage
                          ? 'bg-federal-500 text-white'
                          : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}
            </div>

            {/* Próximo */}
            <button
              onClick={handleNext}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-slate-700 text-slate-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-600 transition-colors"
            >
              <ChevronRight size={20} />
            </button>
          </div>

          {/* Seletor de quantidade */}
          <select
            value={proofsPerPage}
            onChange={(e) => {
              // Resetar para página 1 ao mudar quantidade
              setCurrentPage(1);
              // Chamar callback com novo número
              onProofsChange?.(currentProofs, 1, Math.ceil(proofs.length / Number(e.target.value)));
            }}
            className="px-3 py-1 rounded-lg bg-slate-700 text-slate-300 text-sm border border-slate-600"
          >
            <option value={5}>5 por página</option>
            <option value={10}>10 por página</option>
            <option value={20}>20 por página</option>
            <option value={50}>50 por página</option>
          </select>
        </div>
      )}
    </div>
  );
};

/**
 * ProofCard - Exemplo de card para renderizar prova
 * Altere conforme sua estrutura
 */
export const ProofCardWithPagination = ({ proof, index }) => {
  const getProofIcon = (type) => {
    const icons = {
      'Imagem': '📸',
      'Video': '🎥',
      'Documento': '📄',
      'Audio': '🔊',
      'Link': '🔗',
      'Texto': '✍️'
    };
    return icons[type] || '📎';
  };

  return (
    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-slate-600 transition-colors">
      <div className="flex items-start gap-3">
        {/* Ícone + Tipo */}
        <div className="flex-shrink-0 text-2xl">
          {getProofIcon(proof.tipo)}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="font-semibold text-slate-100">
              {proof.tipo} #{index + 1}
            </h4>
            <span className="text-xs text-slate-400">
              {new Date(proof.data_upload).toLocaleDateString('pt-BR')}
            </span>
          </div>

          {proof.descricao && (
            <p className="text-sm text-slate-300 mb-2 line-clamp-2">
              {proof.descricao}
            </p>
          )}

          {proof.conteudo && (
            <a
              href={proof.conteudo}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-federal-400 hover:text-federal-300 break-all"
            >
              {proof.conteudo.substring(0, 50)}...
            </a>
          )}
        </div>

        {/* Ações */}
        <div className="flex gap-2 flex-shrink-0">
          {/* Aqui adicionar botões de editar/deletar */}
        </div>
      </div>
    </div>
  );
};

/**
 * Hook customizado para usar paginação
 */
export const useProofPagination = (proofs, proofsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(proofs.length / proofsPerPage);
  const startIndex = (currentPage - 1) * proofsPerPage;
  const currentProofs = proofs.slice(startIndex, startIndex + proofsPerPage);

  return {
    currentPage,
    setCurrentPage,
    totalPages,
    currentProofs,
    startIndex,
    totalProofs: proofs.length,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  };
};

export default ProofPagination;
