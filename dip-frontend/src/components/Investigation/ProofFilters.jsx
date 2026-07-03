import React, { useState, useMemo } from 'react';
import { Search, Filter, X, Calendar, Image, Video, Link as LinkIcon, FileText, File, SortAsc } from 'lucide-react';
import clsx from 'clsx';

const ProofFilters = ({ proofs = [], onFilterChange }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');
    const [dateFilter, setDateFilter] = useState('all');
    const [sortBy, setSortBy] = useState('date');

    const types = [
        { id: 'all', icon: Filter, label: 'Todos', count: proofs.length },
        { id: 'image', icon: Image, label: 'Imagens', count: proofs.filter(p => p.type === 'image').length },
        { id: 'video', icon: Video, label: 'Vídeos', count: proofs.filter(p => p.type === 'video').length },
        { id: 'link', icon: LinkIcon, label: 'Links', count: proofs.filter(p => p.type === 'link').length },
        { id: 'text', icon: FileText, label: 'Textos', count: proofs.filter(p => p.type === 'text').length },
        { id: 'file', icon: File, label: 'Arquivos', count: proofs.filter(p => p.type === 'file').length }
    ];

    const dateFilters = [
        { id: 'all', label: 'Todas' },
        { id: 'today', label: 'Hoje' },
        { id: 'week', label: 'Esta Semana' },
        { id: 'month', label: 'Este Mês' }
    ];

    const sortOptions = [
        { id: 'date', label: 'Data' },
        { id: 'type', label: 'Tipo' },
        { id: 'author', label: 'Autor' }
    ];

    // Aplicar filtros
    const filteredProofs = useMemo(() => {
        let result = [...proofs];

        // Filtro de busca
        if (searchTerm) {
            result = result.filter(p => 
                p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.author?.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Filtro de tipo
        if (selectedType !== 'all') {
            result = result.filter(p => p.type === selectedType);
        }

        // Filtro de data
        if (dateFilter !== 'all') {
            const now = new Date();
            const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            
            result = result.filter(p => {
                const proofDate = new Date(p.createdAt);
                
                if (dateFilter === 'today') {
                    return proofDate >= today;
                }
                if (dateFilter === 'week') {
                    const weekAgo = new Date(today);
                    weekAgo.setDate(weekAgo.getDate() - 7);
                    return proofDate >= weekAgo;
                }
                if (dateFilter === 'month') {
                    const monthAgo = new Date(today);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    return proofDate >= monthAgo;
                }
                return true;
            });
        }

        // Ordenação
        result.sort((a, b) => {
            if (sortBy === 'date') {
                return new Date(b.createdAt) - new Date(a.createdAt);
            }
            if (sortBy === 'type') {
                return a.type.localeCompare(b.type);
            }
            if (sortBy === 'author') {
                return (a.author || '').localeCompare(b.author || '');
            }
            return 0;
        });

        return result;
    }, [proofs, searchTerm, selectedType, dateFilter, sortBy]);

    // Notificar mudança
    React.useEffect(() => {
        onFilterChange(filteredProofs);
    }, [filteredProofs, onFilterChange]);

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4">
                
                {/* Busca */}
                <div className="flex-1">
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar provas..."
                            className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-600 focus:border-federal-500 focus:ring-1 focus:ring-federal-500 transition-all outline-none"
                        />
                        {searchTerm && (
                            <button
                                onClick={() => setSearchTerm('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>

                {/* Filtros de Tipo */}
                <div className="flex flex-wrap gap-2">
                    {types.map(type => (
                        <button
                            key={type.id}
                            onClick={() => setSelectedType(type.id)}
                            className={clsx(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors",
                                selectedType === type.id
                                    ? "bg-federal-600 border-federal-500 text-white"
                                    : "bg-slate-800 border-slate-700 text-slate-400 hover:text-white"
                            )}
                        >
                            <type.icon size={14} />
                            <span>{type.label}</span>
                            <span className={clsx(
                                "ml-1 px-1.5 py-0.5 rounded-full text-[10px]",
                                selectedType === type.id
                                    ? "bg-white/20"
                                    : "bg-slate-700"
                            )}>
                                {type.count}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Filtro de Data */}
                <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-federal-500 outline-none"
                >
                    {dateFilters.map(f => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                    ))}
                </select>

                {/* Ordenação */}
                <div className="flex items-center gap-2">
                    <SortAsc size={14} className="text-slate-500" />
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-slate-100 text-sm focus:border-federal-500 outline-none"
                    >
                        {sortOptions.map(s => (
                            <option key={s.id} value={s.id}>Ordenar por {s.label}</option>
                        ))}
                    </select>
                </div>
            </div>
        </div>
    );
};

export default ProofFilters;