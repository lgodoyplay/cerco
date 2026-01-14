import React, { useState } from 'react';
import { CheckCircle2, UserPlus, FileCheck, Target, Award, Brain, Dumbbell } from 'lucide-react';
import { Link } from 'react-router-dom';
import CandidateFormModal from '../../components/CandidateFormModal';

const HowToJoin = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const steps = [
    {
      icon: FileCheck,
      title: "1. Inscrição",
      desc: "Aguarde a abertura do edital e preencha o formulário oficial no portal da prefeitura ou Discord."
    },
    {
      icon: Brain,
      title: "2. Prova Teórica",
      desc: "Avaliação de conhecimentos sobre o Código Penal, Constituição e Regras da Cidade."
    },
    {
      icon: Dumbbell,
      title: "3. Teste Físico",
      desc: "Teste de aptidão física (TAF) avaliando resistência, força e agilidade."
    },
    {
      icon: UserPlus,
      title: "4. Entrevista",
      desc: "Avaliação psicológica e comportamental com a corregedoria e comando."
    },
    {
      icon: Award,
      title: "5. Academia de Polícia",
      desc: "Curso de formação intensivo. Os aprovados se tornam Cadetes."
    }
  ];

  const requirements = [
    "Idade mínima de 21 anos (RP).",
    "Ficha limpa (Sem antecedentes criminais).",
    "Possuir CNH válida (Carro e Moto).",
    "Porte de Arma (Será verificado).",
    "Disponibilidade de horário.",
    "Boa comunicação e disciplina.",
    "Conhecimento das regras do servidor."
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Recrutamento e Seleção</h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-16 leading-relaxed">
          Junte-se à elite. O processo seletivo da Policia Civil é rigoroso e busca apenas os melhores.
          Veja abaixo como se preparar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Process Steps */}
        <div className="lg:col-span-2 space-y-12">
           <div>
             <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
               <Target className="text-federal-500" />
               Etapas do Processo
             </h2>
             
             <div className="relative pl-8 border-l-2 border-slate-800 space-y-12">
               {steps.map((step, index) => (
                 <div key={index} className="relative">
                   <div className="absolute -left-[41px] top-0 w-10 h-10 rounded-full bg-slate-900 border-2 border-federal-600 flex items-center justify-center text-federal-500 shadow-lg shadow-federal-900/50">
                     <step.icon size={20} />
                   </div>
                   <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 hover:bg-slate-800/50 transition-colors">
                     <h3 className="text-xl font-bold text-slate-200 mb-2">{step.title}</h3>
                     <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                   </div>
                 </div>
               ))}
             </div>
           </div>
        </div>

        {/* Requirements Sidebar */}
        <div className="space-y-8">
          <div className="bg-federal-900/20 border border-federal-900/50 rounded-2xl p-8 sticky top-24">
            <h3 className="font-bold text-xl text-white mb-6">Requisitos Obrigatórios</h3>
            <ul className="space-y-4">
              {requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 size={20} className="text-federal-500 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-slate-300 font-medium">{req}</span>
                </li>
              ))}
            </ul>

            <div className="mt-8 pt-8 border-t border-federal-900/50">
              <div className="text-center">
                <p className="text-xs text-slate-500 mb-4 uppercase tracking-widest">Status Atual</p>
                <div className="inline-block px-6 py-2 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-full font-bold mb-6">
                  INSCRIÇÕES ABERTAS
                </div>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="block w-full py-3 bg-white text-federal-900 font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/5 text-center"
                >
                  Preencher Formulário
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <CandidateFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default HowToJoin;
