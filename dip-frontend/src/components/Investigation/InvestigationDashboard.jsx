import React from 'react';
import { FileText, Image, Video, Link as LinkIcon, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import clsx from 'clsx';

const StatCard = ({ icon: Icon, label, value, color = 'federal', trend, subtitle }) => {
    const colorClasses = {
        federal: 'bg-federal-500/10 text-federal-400 border-federal-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        amber: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        red: 'bg-red-500/10 text-red-400 border-red-500/20',
        blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
    };

    return (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className={clsx(
                    "p-3 rounded-lg border",
                    colorClasses[color]
                )}>
                    <Icon size={20} />
                </div>
            </div>
            {trend && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                    {trend.positive ? (
                        <CheckCircle size={12} className="text-emerald-400" />
                    ) : (
                        <AlertCircle size={12} className="text-red-400" />
                    )}
                    <span className={clsx(
                        trend.positive ? "text-emerald-400" : "text-red-400"
                    )}>
                        {trend.value}
                    </span>
                </div>
            )}
        </div>
    );
};

const InvestigationDashboard = ({ investigation, proofs = [] }) => {
    // Calcular estatísticas
    const totalProofs = proofs.length;
    const imageProofs = proofs.filter(p => p.type === 'image').length;
    const videoProofs = proofs.filter(p => p.type === 'video').length;
    const linkProofs = proofs.filter(p => p.type === 'link').length;
    const textProofs = proofs.filter(p => p.type === 'text').length;
    
    // Calcular dias em aberto
    const createdDate = investigation?.createdAt ? new Date(investigation.createdAt) : new Date();
    const daysOpen = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));
    
    // Status
    const status = investigation?.status || 'Em Andamento';
    const statusColor = {
        'Finalizada': 'emerald',
        'Arquivada': 'blue',
        'Em Andamento': 'federal',
        'Pendente': 'amber'
    }[status] || 'federal';

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
                icon={FileText}
                label="Total de Provas"
                value={totalProofs}
                color="federal"
                subtitle={`${imageProofs} imagens, ${videoProofs} vídeos`}
            />
            <StatCard
                icon={Calendar}
                label="Dias em Aberto"
                value={daysOpen}
                color="amber"
                subtitle="Desde a abertura"
            />
            <StatCard
                icon={CheckCircle}
                label="Status"
                value={status}
                color={statusColor}
            />
            <StatCard
                icon={Clock}
                label="Prioridade"
                value={investigation?.priority || 'N/A'}
                color="red"
            />
        </div>
    );
};

export default InvestigationDashboard;