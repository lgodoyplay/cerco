import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search, Filter, ShieldAlert, Eye, Printer, Siren, Lock, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../hooks/useSettings';
import { usePermissions } from '../../hooks/usePermissions';
import { generateWantedPDF } from '../../utils/pdfGenerator';
import NotificationBanner from '../../components/feedback/NotificationBanner';
import { buildWantedRecord } from '../../utils/arrestWantedMedia';

const WantedList = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { can } = usePermissions();
  const { templates } = useSettings();
  const [wantedList, setWantedList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedReasonId, setExpandedReasonId] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ show: false, person: null });
  const [deletePassword, setDeletePassword] = useState('');
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(location.state?.notification || null);

  const canManage = can('wanted_manage');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: wantedData, error: wantedError } = await supabase
          .from('procurados')
          .select('*')
          .order('created_at', { ascending: false });
        if (wantedError) throw wantedError;

        const { data: boletinsData, error: boletinsError } = await supabase
          .from('boletins')
          .select('id, comunicante, descricao');
        if (boletinsError) throw boletinsError;

        const formattedWanted = wantedData.map((item) => buildWantedRecord(
          item,
          boletinsData?.find((bo) => bo.id === item.bo_id)
        ));

        setWantedList(formattedWanted);
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        setNotification({
          type: 'error',
          message: error?.message || 'Nao foi possivel carregar os procurados.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (location.state?.notification) {
      setNotification(location.state.notification);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.pathname, location.state, navigate]);

  useEffect(() => {
    if (!notification) return undefined;

    const timer = window.setTimeout(() => setNotification(null), 3500);
    return () => window.clearTimeout(timer);
  }, [notification]);

  const filteredList = wantedList.filter((person) =>
    (person.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (person.crime || person.reason || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleGenerateFile = async (person) => {
    try {
      await generateWantedPDF(person, user, templates?.wanted);
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel gerar o PDF do procurado.'
      });
    }
  };

  const handleDeleteWanted = async () => {
    if (deletePassword !== '4907') {
      setNotification({ type: 'warning', message: 'Senha incorreta para remover o procurado.' });
      return;
    }

    try {
      const { error } = await supabase
        .from('procurados')
        .delete()
        .eq('id', deleteModal.person.id);

      if (error) throw error;

      setWantedList((prev) => prev.filter((person) => person.id !== deleteModal.person.id));
      setDeleteModal({ show: false, person: null });
      setDeletePassword('');
      setNotification({ type: 'success', message: 'Procurado removido com sucesso.' });
    } catch (error) {
      console.error('Erro ao remover procurado:', error);
      setNotification({
        type: 'error',
        message: error?.message || 'Nao foi possivel remover o procurado.'
      });
    }
  };

  const toggleReason = (personId) => {
    setExpandedReasonId((current) => (current === personId ? null : personId));
  };

  return (
    <div className="space-y-6">
      <NotificationBanner
        notification={notification}
        onClose={() => setNotification(null)}
      />

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Carregando procurados...
          </div>
        )}
        {!loading && filteredList.map((person) => (
          <div key={person.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-federal-600/50 transition-all group flex flex-col">
            <div className="h-56 relative flex items-center justify-center overflow-hidden bg-slate-950">
              {person.image ? (
                <img src={person.image} alt={person.name} className="w-full h-full object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
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
                <button onClick={() => navigate(`/dashboard/wanted/${person.id}`)} className="text-slate-500 hover:text-white p-1">
                  <Eye size={20} />
                </button>
              </div>

              <div className="space-y-4 mb-6 flex-1">
                <div>
                  <button
                    type="button"
                    onClick={() => toggleReason(person.id)}
                    className="w-full bg-slate-950 hover:bg-slate-900 border border-slate-800 rounded-xl px-3 py-3 text-left transition-colors"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold">Crimes / Motivo</p>
                        <p className="text-sm text-white mt-1">Clique para visualizar</p>
                      </div>
                      {expandedReasonId === person.id ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                    </div>
                  </button>
                  {expandedReasonId === person.id && (
                    <div className="mt-3 bg-slate-950 border border-slate-800 rounded-xl p-3">
                      <p className="text-sm text-slate-300 whitespace-pre-line">{person.crime || person.reason || 'Nao informado.'}</p>
                    </div>
                  )}
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
                      {person.reward === 'A definir' || !person.reward ? 'A definir' : `R$ ${person.reward}`}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex gap-2">
                <button
                  onClick={() => navigate(`/dashboard/wanted/${person.id}`)}
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
                {canManage && (
                  <button
                    onClick={() => setDeleteModal({ show: true, person })}
                    className="px-3 py-2 bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400 rounded-lg transition-colors"
                    title="Remover"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredList.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500">
            Nenhum procurado encontrado com os critérios atuais.
          </div>
        )}
      </div>

      {deleteModal.show && deleteModal.person && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl animate-fade-in-up">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Trash2 className="text-red-500" />
                Remover Procurado
              </h3>
              <button onClick={() => { setDeleteModal({ show: false, person: null }); setDeletePassword(''); }} className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <X className="text-slate-400 hover:text-white" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-slate-300">
                Tem certeza que deseja remover o registro de procurado de <span className="font-bold text-white">{deleteModal.person.name}</span>?
              </p>

              <div className="space-y-2">
                <label className="text-xs text-slate-500 uppercase font-bold flex items-center gap-2">
                  <Lock size={14} />
                  Senha de Confirmação
                </label>
                <input
                  type="password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="Digite a senha..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 focus:outline-none focus:border-red-500 transition-colors"
                  onKeyDown={(e) => e.key === 'Enter' && handleDeleteWanted()}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setDeleteModal({ show: false, person: null }); setDeletePassword(''); }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteWanted}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl font-bold shadow-lg transition-colors"
                >
                  Remover
                </button>
              </div>
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
