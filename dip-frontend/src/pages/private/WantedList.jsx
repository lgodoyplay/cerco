import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Filter, AlertTriangle, MoreVertical, ShieldAlert, Eye, FileText, Printer, X, Siren, Lock } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { usePermissions } from '../../hooks/usePermissions';
import { generateWantedPDF } from '../../utils/pdfGenerator';

const WantedList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { templates } = useSettings();
  const [wantedList, setWantedList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPerson, setSelectedPerson] = useState(null);

  const canManage = can('wanted_manage');

  useEffect(() => {
    const fetchWanted = async () => {
      try {
        const { data, error } = await supabase
          .from('procurados')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;

        const formattedWanted = data.map(item => ({
          ...item,
          name: item.nome,
          crime: item.motivo,
          dangerLevel: item.periculosidade,
          reward: item.recompensa,
          date: item.created_at,
          image: item.foto_principal,
          document: item.documento
        }));
        setWantedList(formattedWanted);
      } catch (error) {
        console.error('Erro ao buscar procurados:', error);
      }
    };

    fetchWanted();
  }, []);

  const filteredList = wantedList.filter(person => 
    (person.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.crime || person.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateFile = async (person) => {
    try {
      await generateWantedPDF(person, user, templates?.wanted);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      alert("Erro ao gerar PDF do procurado.");
    }
  };

  const handleArrest = () => {
    if (!selectedPerson) return;
    
    navigate('/dashboard/arrest', { 
      state: { 
        wantedPerson: {
          name: selectedPerson.name,
          document: selectedPerson.document,
          reason: selectedPerson.crime || selectedPerson.reason,
          image: selectedPerson.image || selectedPerson.images?.proof1
        }
      } 
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Siren className="text-red-500" size={28} />
            Registro de Procurados
          </h2>
          <p className="text-slate-400 mt-1">Gerenciamento e consulta de mandados de prisão ativos.</p>
        </div>
        {canManage && (
          <button 
            onClick={() => navigate('/dashboard/register-wanted')}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center gap-2"
          >
            <ShieldAlert size={18} />
            + Adicionar Procurado
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
          <input 
            type="text" 
            placeholder="Buscar por nome ou crime..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-slate-200 focus:outline-none focus:border-federal-500 transition-colors"
          />
        </div>
        <button className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-lg flex items-center gap-2 transition-colors">
          <Filter size={18} />
          Filtros
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredList.map((person) => (
          <div key={person.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-federal-600/50 transition-all group flex flex-col">
            <div className="h-56 bg-slate-800 relative flex items-center justify-center overflow-hidden bg-slate-950">
              {person.images?.proof1 || person.image ? (
                <img src={person.images?.proof1 || person.image} alt={person.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
              ) : (
                <UserPlaceholder />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
              <div className="absolute top-4 right-4 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider shadow-lg animate-pulse">
                Procurado
              </div>
            </div>
            
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors line-clamp-1">{person.name}</h3>
                <button onClick={() => setSelectedPerson(person)} className="text-slate-500 hover:text-white p-1">
                  <Eye size={20} />
                </button>
              </div>
              
              <div className="space-y-4 mb-6 flex-1">
                <div>
                  <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Crimes / Motivo</p>
                  <p className="text-sm text-slate-300 line-clamp-2">{person.crime || person.reason}</p>
                </div>
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Periculosidade</p>
                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-bold ${
                      (person.dangerLevel || person.status) === 'Alta' || (person.dangerLevel || person.status) === 'Extrema' 
                        ? 'bg-red-500/20 text-red-400' 
                        : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {person.dangerLevel || person.status}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Recompensa</p>
                    <p className="text-lg text-emerald-400 font-bold">
                      {person.reward === 'A definir' ? 'A definir' : `R$ ${person.reward}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2">
                <button 
                  onClick={() => setSelectedPerson(person)}
                  className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors"
                >
                  Ver Detalhes
                </button>
                <button 
                  onClick={() => handleGenerateFile(person)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                  title="Imprimir Ficha"
                >
                  <Printer size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {filteredList.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Nenhum procurado encontrado com os critérios atuais.
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedPerson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl shadow-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 sticky top-0 bg-slate-900 z-10">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-red-500" />
                Ficha do Procurado
              </h3>
              <button onClick={() => setSelectedPerson(null)} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <div className="aspect-[3/4] rounded-xl overflow-hidden border-2 border-slate-800 bg-slate-950 shadow-lg relative">
                    {selectedPerson.images?.proof1 || selectedPerson.image ? (
                      <img src={selectedPerson.images?.proof1 || selectedPerson.image} alt={selectedPerson.name} className="w-full h-full object-cover" />
                    ) : (
                      <UserPlaceholder />
                    )}
                    <div className="absolute bottom-0 inset-x-0 bg-red-600 text-white text-center py-1 font-bold uppercase text-sm">
                      PROCURADO
                    </div>
                  </div>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedPerson.name}</h2>
                    <p className="text-red-400 font-mono text-sm mt-1">DOC: {selectedPerson.document || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-500 uppercase">Periculosidade</span>
                      <p className="text-white font-bold">{selectedPerson.dangerLevel || selectedPerson.status}</p>
                    </div>
                    <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                      <span className="text-xs text-slate-500 uppercase">Recompensa</span>
                      <p className="text-emerald-400 font-bold">{selectedPerson.reward === 'A definir' ? 'A definir' : `R$ ${selectedPerson.reward}`}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-auto">
                    {canManage && (
                      <button 
                        onClick={handleArrest}
                        className="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-lg transition-colors shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                      >
                        <Lock size={20} />
                        CONFIRMAR PRISÃO
                      </button>
                    )}
                    {canManage && (
                      <p className="text-center text-xs text-slate-500 mt-2">
                        Esta ação moverá o registro para a lista de prisões e removerá dos procurados.
                      </p>
                    )}
                  </div>

                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                    <h4 className="text-xs text-slate-500 uppercase font-bold mb-2">Crimes / Motivo</h4>
                    <p className="text-slate-300 text-sm leading-relaxed">
                      {selectedPerson.crime || selectedPerson.reason}
                    </p>
                  </div>

                  {selectedPerson.observations && (
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                      <h4 className="text-xs text-slate-500 uppercase font-bold mb-2">Observações</h4>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {selectedPerson.observations}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      onClick={() => handleGenerateFile(selectedPerson)}
                      className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <Printer size={18} />
                      Imprimir Ficha Completa
                    </button>
                  </div>
                </div>
              </div>

              {/* Additional Photos */}
              {selectedPerson.images && (
                <div className="mt-8">
                  <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-800 pb-2">Outras Evidências</h4>
                  <div className="grid grid-cols-4 gap-4">
                    {['proof2', 'proof3', 'proof4'].map((key) => (
                      selectedPerson.images[key] && (
                        <div key={key} className="aspect-square rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                          <img src={selectedPerson.images[key]} alt={key} className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform" />
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const UserPlaceholder = () => (
  <div className="w-full h-full bg-slate-800 flex flex-col items-center justify-center text-slate-600">
    <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-2">
      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    </div>
    <span className="text-xs font-bold uppercase">Sem Foto</span>
  </div>
);

export default WantedList;
