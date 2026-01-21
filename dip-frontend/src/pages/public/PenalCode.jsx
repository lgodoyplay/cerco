import React, { useState } from 'react';
import { Gavel, Search, ChevronDown, ChevronUp } from 'lucide-react';

const PenalCode = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSection, setExpandedSection] = useState(null);

  // Exemplo de estrutura - Será preenchido com o documento do usuário
  const penalCode = [
    {
      title: "Parte Geral",
      articles: [
        { art: "1º", text: "Não há crime sem lei anterior que o defina. Não há pena sem prévia cominação legal." }
      ]
    },
    // Adicionar mais seções aqui
  ];

  const toggleSection = (index) => {
    setExpandedSection(expandedSection === index ? null : index);
  };

  const filteredCode = penalCode.filter(section => 
    section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    section.articles.some(article => 
      article.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.art.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-3 bg-federal-600/20 rounded-xl mb-4">
            <Gavel className="w-10 h-10 text-federal-500" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-4">Código Penal</h1>
          <p className="text-slate-400 text-lg">
            Legislação e normas vigentes da cidade
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative mb-8">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-500" />
          </div>
          <input
            type="text"
            className="block w-full pl-11 pr-4 py-3 bg-slate-900 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-federal-500 focus:border-transparent transition-all"
            placeholder="Pesquisar artigos, crimes ou penas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Content */}
        <div className="space-y-4">
          {filteredCode.length > 0 ? (
            filteredCode.map((section, index) => (
              <div 
                key={index}
                className="bg-slate-900/50 border border-slate-800 rounded-xl overflow-hidden hover:border-federal-500/30 transition-colors"
              >
                <button
                  onClick={() => toggleSection(index)}
                  className="w-full px-6 py-4 flex items-center justify-between bg-slate-800/30 hover:bg-slate-800/50 transition-colors"
                >
                  <h3 className="text-lg font-semibold text-white">{section.title}</h3>
                  {expandedSection === index ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>
                
                {(expandedSection === index || searchTerm) && (
                  <div className="p-6 space-y-4">
                    {section.articles.map((article, artIndex) => (
                      <div key={artIndex} className="flex gap-4 p-3 rounded-lg hover:bg-slate-800/30 transition-colors">
                        <span className="font-mono text-federal-400 font-bold whitespace-nowrap">
                          Art. {article.art}
                        </span>
                        <p className="text-slate-300 leading-relaxed">
                          {article.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <p className="text-slate-500">Nenhum resultado encontrado para sua busca.</p>
            </div>
          )}
        </div>

        {/* Empty State / Instruction */}
        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center">
          <p className="text-yellow-200/80 text-sm">
            O conteúdo do Código Penal precisa ser inserido. Por favor, forneça o documento com as leis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PenalCode;
