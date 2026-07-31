import React from 'react';
import { FileText, Image, Video, Link as LinkIcon, Calendar, AlertCircle, CheckCircle, Clock, TrendingUp, BarChart3 } from 'lucide-react';
import clsx from 'clsx';

const colorMap = {
    federal: { bg: 'bg-federal-500/10', text: 'text-federal-400', border: 'border-federal-500/20', glow: 'shadow-federal-900/20' },
    emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', glow: 'shadow-emerald-900/20' },
    purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/20', glow: 'shadow-purple-900/20' },
    amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/20', glow: 'shadow-amber-900/20' },
    red: { bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/20', glow: 'shadow-red-900/20' },
    blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/20', glow: 'shadow-blue-900/20' },
};

const SkeletonStatCard = () => (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 animate-pulse">
        <div className="flex items-start justify-between">
            <div className="space-y-2">
                <div className="h-3 w-20 bg-slate-800 rounded" />
                <div className="h-8 w-12 bg-slate-800 rounded" />
                <div className="h-3 w-24 bg-slate-800 rounded" />
            </div>
            <div className="h-10 w-10 bg-slate-800 rounded-lg" />
        </div>
    </div>
);

const StatCard = ({ icon: Icon, label, value, color = 'federal', trend, subtitle }) => {
    const colors = colorMap[color] || colorMap.federal;

    return (
        <div
            role="region"
            aria-label={`${label}: ${value}`}
            className={clsx(
                "bg-slate-900 border border-slate-800 rounded-xl p-5 transition-all hover:border-slate-700 hover:shadow-lg hover:shadow-black/20 hover:-translate-y-0.5"
            )}
        >
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{value}</p>
                    {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
                </div>
                <div className={clsx(
                    "p-3 rounded-lg border transition-colors",
                    colors.bg, colors.text, colors.border
                )}>
                    <Icon size={20} />
                </div>
            </div>
            {trend && (
                <div className="mt-3 flex items-center gap-1 text-xs">
                    {trend.positive ? (
                        <TrendingUp size={12} className="text-emerald-400" />
                    ) : (
                        <TrendingUp size={12} className="text-red-400 rotate-180" />
                    )}
                    <span className={clsx(
                        "font-medium",
                        trend.positive ? "text-emerald-400" : "text-red-400"
                    )}>
                        {trend.value}
                    </span>
                    {trend.label && <span className="text-slate-500">{trend.label}</span>}
                </div>
            )}
        </div>
    );
};

const InvestigationDashboard = ({ investigation, proofs = [], loading = false }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
                <SkeletonStatCard />
            </div>
        );
    }

    const totalProofs = proofs.length;
    const imageProofs = proofs.filter(p => p.type === 'image').length;
    const videoProofs = proofs.filter(p => p.type === 'video').length;
    const linkProofs = proofs.filter(p => p.type === 'link').length;
    const textProofs = proofs.filter(p => p.type === 'text').length;

    const createdDate = investigation?.createdAt ? new Date(investigation.createdAt) : new Date();
    const daysOpen = Math.floor((new Date() - createdDate) / (1000 * 60 * 60 * 24));

    const status = investigation?.status || 'Em Andamento';
    const statusColor = {
        'Finalizada': 'emerald',
        'Arquivada': 'blue',
        'Em Andamento': 'federal',
        'Pendente': 'amber'
    }[status] || 'federal';

    const totalProofsByType = [
        { type: 'image', count: imageProofs, label: 'Imagens', color: 'blue' },
        { type: 'video', count: videoProofs, label: 'Vídeos', color: 'purple' },
        { type: 'link', count: linkProofs, label: 'Links', color: 'emerald' },
        { type: 'text', count: textProofs, label: 'Textos', color: 'amber' },
    ].filter(item => item.count > 0);

    if (!investigation && proofs.length === 0) {
        return (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 text-center mb-6">
                <BarChart3 size={48} className="text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-300 mb-2">Nenhuma investigação selecionada</h3>
                <p className="text-slate-500 text-sm">Selecione uma investigação para visualizar suas estatísticas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
                    trend={daysOpen > 30 ? { positive: false, value: `${daysOpen} dias`, label: 'crítico' } : { positive: true, value: `${daysOpen} dias`, label: 'normal' }}
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

            {totalProofsByType.length > 0 && (
                <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Provas por Tipo</h4>
                    <div className="flex gap-3 flex-wrap">
                        {totalProofsByType.map(item => (
                            <div key={item.type} className={clsx(
                                "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
                                colorMap[item.color]?.bg,
                                colorMap[item.color]?.border
                            )}>
                                <span className={clsx("text-lg font-bold", colorMap[item.color]?.text)}>{item.count}</span>
                                <span className="text-xs text-slate-400">{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default InvestigationDashboard;