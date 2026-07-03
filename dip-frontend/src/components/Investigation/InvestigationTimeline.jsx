import React from 'react';
import { Calendar, Image, Video, FileText, File, CheckCircle, AlertCircle, Clock, User } from 'lucide-react';
import clsx from 'clsx';

const EVENT_ICONS = {
    created: Calendar,
    proof_added: Image,
    proof_updated: FileText,
    proof_deleted: AlertCircle,
    status_changed: CheckCircle,
    pdf_generated: File,
    user_added: User
};

const EVENT_LABELS = {
    created: 'Investigação Criada',
    proof_added: 'Prova Adicionada',
    proof_updated: 'Prova Atualizada',
    proof_deleted: 'Prova Removida',
    status_changed: 'Status Alterado',
    pdf_generated: 'PDF Gerado',
    user_added: 'Agente Adicionado'
};

const InvestigationTimeline = ({ investigation, proofs = [] }) => {
    // Construir eventos da timeline
    const events = [];

    // Evento de criação
    if (investigation?.createdAt) {
        events.push({
            id: 'created',
            type: 'created',
            date: investigation.createdAt,
            user: investigation.author || 'Sistema',
            title: 'Investigação Criada',
            description: investigation.title || investigation.description
        });
    }

    // Eventos de provas
    proofs.forEach(proof => {
        events.push({
            id: `proof_${proof.id}`,
            type: 'proof_added',
            date: proof.createdAt,
            user: proof.author,
            title: proof.title,
            description: proof.description,
            proofType: proof.type
        });
    });

    // Ordenar por data (mais recente primeiro)
    events.sort((a, b) => new Date(b.date) - new Date(a.date));

    if (events.length === 0) {
        return (
            <div className="text-center py-8">
                <Clock size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-500">Nenhum evento registrado</p>
            </div>
        );
    }

    return (
        <div className="relative">
            {/* Linha central */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-slate-700" />

            <div className="space-y-6">
                {events.map((event, index) => {
                    const Icon = EVENT_ICONS[event.type] || FileText;
                    
                    return (
                        <div key={event.id} className="relative flex items-start gap-4">
                            {/* Marcador */}
                            <div className={clsx(
                                "w-12 h-12 rounded-full flex items-center justify-center z-10 border-2",
                                index === 0 
                                    ? "bg-federal-600 border-federal-500" 
                                    : "bg-slate-800 border-slate-700"
                            )}>
                                <Icon size={20} className={index === 0 ? "text-white" : "text-slate-400"} />
                            </div>

                            {/* Conteúdo */}
                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl p-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-white font-bold">{event.title}</h4>
                                    <span className="text-xs text-slate-500">
                                        {new Date(event.date).toLocaleDateString('pt-BR', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </span>
                                </div>
                                
                                {event.description && (
                                    <p className="text-sm text-slate-400 line-clamp-2">
                                        {event.description}
                                    </p>
                                )}

                                {event.proofType && (
                                    <div className="mt-2">
                                        <span className={clsx(
                                            "text-xs font-bold px-2 py-1 rounded",
                                            {
                                                'image': 'bg-emerald-500/20 text-emerald-400',
                                                'video': 'bg-purple-500/20 text-purple-400',
                                                'link': 'bg-blue-500/20 text-blue-400',
                                                'text': 'bg-amber-500/20 text-amber-400'
                                            }[event.proofType] || 'bg-slate-700 text-slate-400'
                                        )}>
                                            {event.proofType.toUpperCase()}
                                        </span>
                                    </div>
                                )}

                                {event.user && (
                                    <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
                                        <User size={12} />
                                        {event.user}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default InvestigationTimeline;