import { useState, useCallback, useMemo } from 'react';
import { formatDate } from '../utils/pdfBase';

/**
 * Hook customizado para gerenciar investigações
 * @param {Object} investigation - Dados da investigação
 * @param {Array} proofs - Array de provas
 * @returns {Object} Estado e funções da investigação
 */
const useInvestigation = (investigation, proofs = []) => {
    const [localProofs, setLocalProofs] = useState(proofs);

    // Estatísticas calculadas
    const stats = useMemo(() => {
        const total = localProofs.length;
        const byType = localProofs.reduce((acc, proof) => {
            acc[proof.type] = (acc[proof.type] || 0) + 1;
            return acc;
        }, {});

        const byAuthor = localProofs.reduce((acc, proof) => {
            const author = proof.author || 'Desconhecido';
            acc[author] = (acc[author] || 0) + 1;
            return acc;
        }, {});

        const daysOpen = investigation?.createdAt 
            ? Math.floor((new Date() - new Date(investigation.createdAt)) / (1000 * 60 * 60 * 24))
            : 0;

        return {
            total,
            byType,
            byAuthor,
            daysOpen,
            hasProofs: total > 0,
            imageCount: byType.image || 0,
            videoCount: byType.video || 0,
            linkCount: byType.link || 0,
            textCount: byType.text || 0
        };
    }, [localProofs, investigation]);

    // Adicionar prova
    const addProof = useCallback((proof) => {
        const newProof = {
            ...proof,
            id: proof.id || `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            createdAt: proof.createdAt || new Date().toISOString()
        };
        setLocalProofs(prev => [...prev, newProof]);
        return newProof;
    }, []);

    // Atualizar prova
    const updateProof = useCallback((id, updates) => {
        setLocalProofs(prev => 
            prev.map(proof => 
                proof.id === id ? { ...proof, ...updates } : proof
            )
        );
    }, []);

    // Deletar prova
    const deleteProof = useCallback((id) => {
        setLocalProofs(prev => prev.filter(proof => proof.id !== id));
    }, []);

    // Obter prova por ID
    const getProofById = useCallback((id) => {
        return localProofs.find(proof => proof.id === id);
    }, [localProofs]);

    // Validar investigação
    const validateInvestigation = useCallback(() => {
        const errors = [];
        
        if (!investigation?.id) {
            errors.push('ID da investigação é obrigatório');
        }
        
        if (!investigation?.description) {
            errors.push('Descrição da investigação é obrigatória');
        }
        
        if (!investigation?.involved || investigation.involved.length === 0) {
            errors.push('Pelo menos um investigado é obrigatório');
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }, [investigation]);

    // Formatar número do inquérito
    const formatInvestigationNumber = useCallback(() => {
        if (!investigation?.id) return 'N/A';
        
        const year = new Date(investigation.createdAt || Date.now()).getFullYear();
        const sequential = String(investigation.id).padStart(7, '0').slice(-7);
        
        return `${sequential}/${year}`;
    }, [investigation]);

    return {
        proofs: localProofs,
        stats,
        addProof,
        updateProof,
        deleteProof,
        getProofById,
        validateInvestigation,
        formatInvestigationNumber
    };
};

export default useInvestigation;