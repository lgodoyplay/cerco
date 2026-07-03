import React, { useState } from 'react';
import { Grid, List, ChevronLeft, ChevronRight, ZoomIn, Download, Share2, Edit2, Trash2 } from 'lucide-react';
import ProofCard from '../investigations/ProofCard';
import clsx from 'clsx';

const ProofsView = ({ proofs = [], onProofClick, onDelete, onEdit, canEdit }) => {
    const [viewMode, setViewMode] = useState('grid');
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // Paginação
    const totalPages = Math.ceil(proofs.length / itemsPerPage);
    const paginatedProofs = proofs.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    if (proofs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                    <Grid size={32} className="text-slate-600" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Nenhuma prova encontrada</h3>
                <p className="text-slate-500 max-w-md">
                    Não há provas que correspondam aos filtros selecionados. Tente ajustar os filtros ou adicionar uma nova prova.
                </p>
            </div>
        );
    }

    return (
        <div>
            {/* View Toggle */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">
                    {proofs.length} {proofs.length === 1 ? 'prova' : 'provas'} encontradas
                </h3>
                
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg p-1">
                    <button
                        onClick={() => setViewMode('grid')}
                        className={clsx(
                            "p-2 rounded transition-colors",
                            viewMode === 'grid' ? "bg-federal-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                        title="Visualização em grade"
                    >
                        <Grid size={16} />
                    </button>
                    <button
                        onClick={() => setViewMode('list')}
                        className={clsx(
                            "p-2 rounded transition-colors",
                            viewMode === 'list' ? "bg-federal-600 text-white" : "text-slate-400 hover:text-white"
                        )}
                        title="Visualização em lista"
                    >
                        <List size={16} />
                    </button>
                </div>
            </div>

            {/* Grid View */}
            {viewMode === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {paginatedProofs.map(proof => (
                        <ProofCard
                            key={proof.id}
                            proof={proof}
                            onClick={onProofClick}
                            onDelete={onDelete}
                            onEdit={onEdit}
                            canEdit={canEdit}
                        />
                    ))}
                </div>
            )}

            {/* List View */}
            {viewMode === 'list' && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-slate-950 border-b border-slate-800">
                            <tr>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Tipo</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Título</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Data</th>
                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase">Autor</th>
                                <th className="text-right px-4 py-3 text-xs font-bold text-slate-400 uppercase">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedProofs.map(proof => (
                                <tr 
                                    key={proof.id}
                                    className="border-b border-slate-800 last:border-0 hover:bg-slate-950/50 transition-colors cursor-pointer"
                                    onClick={() => onProofClick && onProofClick(proof)}
                                >
                                    <td className="px-4 py-3">
                                        <span className="text-xs font-bold text-slate-300 capitalize">{proof.type}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-sm text-white font-medium">{proof.title}</span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-500">
                                            {new Date(proof.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-slate-400">{proof.author}</span>
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        {canEdit && (
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onEdit && onEdit(proof); }}
                                                    className="p-1.5 hover:bg-amber-500/20 text-amber-400 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={14} />
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); onDelete && onDelete(proof.id); }}
                                                    className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                                                    title="Deletar"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                    <button
                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                        disabled={currentPage === 1}
                        className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronLeft size={16} />
                    </button>
                    
                    <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                            <button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                className={clsx(
                                    "w-8 h-8 rounded-lg text-sm font-bold transition-colors",
                                    currentPage === page
                                        ? "bg-federal-600 text-white"
                                        : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
                                )}
                            >
                                {page}
                            </button>
                        ))}
                    </div>
                    
                    <button
                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                        disabled={currentPage === totalPages}
                        className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProofsView;