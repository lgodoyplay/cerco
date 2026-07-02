import React, { useState } from 'react';
import ProofPagination, { ProofCardWithPagination } from '../components/ProofPagination';

/**
 * EXEMPLO: Como usar ProofPagination em InvestigationDetail
 * 
 * Antes: Carregava todas as 1000 provas de uma vez = lento ❌
 * Depois: Pagina 10 provas por página = rápido ⚡
 */

const InvestigationDetailExampleWithPagination = ({ investigation }) => {
  const [proofs, setProofs] = useState(investigation.provas || []);
  const [currentPageInfo, setCurrentPageInfo] = useState({
    page: 1,
    totalPages: 1,
    displayedProofs: []
  });

  // Callback quando página muda
  const handleProofsPageChange = (displayedProofs, page, totalPages) => {
    setCurrentPageInfo({
      page,
      totalPages,
      displayedProofs
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {investigation.titulo}
        </h1>
        <p className="text-slate-400">
          {proofs.length} provas | Página {currentPageInfo.page} de {currentPageInfo.totalPages}
        </p>
      </div>

      {/* Seção de provas com paginação */}
      <div className="bg-slate-900 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          📎 Provas e Documentos
        </h2>

        <ProofPagination
          proofs={proofs}
          renderProof={(proof, index) => (
            <ProofCardWithPagination
              key={proof.id}
              proof={proof}
              index={index}
            />
          )}
          proofsPerPage={10}
          onProofsChange={handleProofsPageChange}
        />
      </div>

      {/* Info adicional */}
      <div className="text-xs text-slate-500">
        Carregando {currentPageInfo.displayedProofs.length} provas para exibição
      </div>
    </div>
  );
};

/**
 * ============================================
 * ANTES (Sem Paginação)
 * ============================================
 * 
 * const { data: proofs } = await supabase
 *   .from('provas')
 *   .select('*')
 *   .eq('investigacao_id', investigationId);
 * 
 * return proofs.map(p => <ProofCard proof={p} />);
 * 
 * ❌ Problemas:
 * - Carrega TODAS as provas na memória
 * - Se 1000 provas: 10MB+ de JSON
 * - Renderiza 1000 elementos DOM
 * - Scroll lento
 * - Time to Interactive = 10+ segundos
 * 
 * ============================================
 * DEPOIS (Com Paginação)
 * ============================================
 * 
 * <ProofPagination
 *   proofs={allProofs}
 *   renderProof={ProofCard}
 *   proofsPerPage={10}
 * />
 * 
 * ✅ Benefícios:
 * - Renderiza apenas 10 provas por página
 * - Memória reduzida
 * - DOM reduzido
 * - Scroll rápido
 * - TTI = 1-2 segundos
 * - Usuário navega facilmente entre páginas
 */

export default InvestigationDetailExampleWithPagination;
