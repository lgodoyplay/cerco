import React from 'react';
import { Construction } from 'lucide-react';

const ComingSoon = ({ title }) => (
  <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/30">
    <Construction size={48} className="mb-4 text-federal-500 opacity-50" />
    <h2 className="text-xl font-bold text-slate-300 mb-2">{title}</h2>
    <p className="text-sm">Módulo em desenvolvimento pelo setor de TI.</p>
  </div>
);

export default ComingSoon;
