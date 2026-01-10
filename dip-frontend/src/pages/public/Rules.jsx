import React from 'react';
import { ShieldCheck, Book, AlertCircle } from 'lucide-react';

const Rules = () => {
  const rules = [
    {
      title: "Art. 1º - Conduta e Disciplina",
      items: [
        "O agente deve manter conduta ilibada dentro e fora de serviço.",
        "É proibido o uso de entorpecentes ou substâncias ilícitas.",
        "O respeito à hierarquia é pilar fundamental da corporação.",
        "O uso do uniforme é obrigatório durante o turno de serviço."
      ]
    },
    {
      title: "Art. 2º - Procedimentos Operacionais",
      items: [
        "O uso da força deve ser escalonado e proporcional à ameaça.",
        "Toda abordagem deve ser iniciada com identificação clara do agente.",
        "O disparo de arma de fogo é o último recurso.",
        "É obrigatório prestar socorro a vítimas e suspeitos feridos após neutralização."
      ]
    },
    {
      title: "Art. 3º - Uso de Veículos e Equipamentos",
      items: [
        "Zelar pela manutenção e integridade das viaturas.",
        "Proibido o uso de sirene e giroflex sem ocorrência em andamento.",
        "O armamento deve ser portado de forma segura e discreta quando à paisana.",
        "Equipamentos táticos (caveirão, helicóptero) requerem autorização expressa."
      ]
    },
    {
      title: "Art. 4º - Sigilo e Informação",
      items: [
        "É estritamente proibido vazar informações de investigações.",
        "O acesso ao banco de dados é monitorado e de uso exclusivo profissional.",
        "Não comentar sobre operações em redes sociais ou com civis."
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-white mb-4">Regulamento Interno</h1>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Normas e diretrizes que regem a conduta dos agentes da DIP Polícia Civil.
          O desconhecimento da lei não isenta o agente de culpa.
        </p>
      </div>

      <div className="space-y-8">
        {rules.map((section, index) => (
          <div key={index} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-federal-600/30 transition-all">
            <div className="bg-slate-800/50 px-6 py-4 border-b border-slate-800 flex items-center gap-3">
              <Book className="text-federal-500" size={20} />
              <h3 className="font-bold text-lg text-white">{section.title}</h3>
            </div>
            <div className="p-6">
              <ul className="space-y-4">
                {section.items.map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-300 group">
                    <span className="mt-2 w-1.5 h-1.5 rounded-full bg-slate-600 group-hover:bg-federal-500 transition-colors flex-shrink-0" />
                    <span className="text-base leading-relaxed">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}

        <div className="bg-red-950/20 border border-red-900/50 rounded-xl p-6 flex gap-4 mt-8">
           <AlertCircle className="text-red-500 flex-shrink-0 mt-1" size={24} />
           <div>
             <h4 className="text-red-400 font-bold mb-2">Penalidades</h4>
             <p className="text-sm text-red-300/80 leading-relaxed">
               Infrações leves serão punidas com advertência verbal ou escrita. Reincidências ou infrações graves
               levarão a suspensão temporária, rebaixamento de patente ou expulsão permanente da corporação (Exoneração).
             </p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default Rules;
