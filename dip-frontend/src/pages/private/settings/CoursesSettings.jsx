import React, { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { 
  BookOpen, 
  Plus, 
  Search, 
  Trash2, 
  UserPlus, 
  Users, 
  X, 
  CheckCircle, 
  ShieldAlert,
  GraduationCap
} from 'lucide-react';

const CoursesSettings = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  
  // Form states
  const [newCourse, setNewCourse] = useState({ nome: '', descricao: '' });
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [officers, setOfficers] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    fetchUserRole();
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchAssignments(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchUserRole = async () => {
    try {
      if (!user) return;
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      setUserRole(data?.role);
    } catch (error) {
      console.error('Error fetching role:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cursos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCourses(data || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAssignments = async (courseId) => {
    try {
      const { data, error } = await supabase
        .from('cursos_policiais')
        .select(`
          *,
          profiles:policial_id (full_name, role, avatar_url)
        `)
        .eq('curso_id', courseId);

      if (error) throw error;
      setAssignments(data || []);
    } catch (error) {
      console.error('Error fetching assignments:', error);
    }
  };

  const fetchOfficers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .order('full_name');

      if (error) throw error;
      setOfficers(data || []);
    } catch (error) {
      console.error('Error fetching officers:', error);
    }
  };

  const handleCreateCourse = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from('cursos')
        .insert([{
          nome: newCourse.nome,
          descricao: newCourse.descricao,
          criado_por: user.id
        }]);

      if (error) throw error;
      
      setShowCreateModal(false);
      setNewCourse({ nome: '', descricao: '' });
      fetchCourses();
    } catch (error) {
      console.error('Error creating course:', error);
      alert('Erro ao criar curso. Verifique suas permissões.');
    }
  };

  const handleAssignCourse = async (e) => {
    e.preventDefault();
    try {
      // Check if already assigned
      const exists = assignments.some(a => a.policial_id === selectedOfficer);
      if (exists) {
        alert('Este policial já possui este curso.');
        return;
      }

      const { error } = await supabase
        .from('cursos_policiais')
        .insert([{
          curso_id: selectedCourse.id,
          policial_id: selectedOfficer,
          atribuido_por: user.id
        }]);

      if (error) throw error;

      setShowAssignModal(false);
      setSelectedOfficer('');
      fetchAssignments(selectedCourse.id);
    } catch (error) {
      console.error('Error assigning course:', error);
      alert('Erro ao atribuir curso. Verifique suas permissões.');
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!confirm('Tem certeza que deseja remover este curso do policial?')) return;

    try {
      const { error } = await supabase
        .from('cursos_policiais')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;
      fetchAssignments(selectedCourse.id);
    } catch (error) {
      console.error('Error removing assignment:', error);
      alert('Erro ao remover atribuição. Verifique suas permissões.');
    }
  };

  const handleDeleteCourse = async (courseId, e) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja excluir este curso? Todas as atribuições serão removidas.')) return;

    try {
      const { error } = await supabase
        .from('cursos')
        .delete()
        .eq('id', courseId);

      if (error) throw error;
      if (selectedCourse?.id === courseId) setSelectedCourse(null);
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Erro ao excluir curso. Verifique suas permissões.');
    }
  };

  const openAssignModal = () => {
    fetchOfficers();
    setShowAssignModal(true);
  };

  // Permissões: Diretor, Coordenador, Escrivão e Agente (todos podem gerenciar para testes)
  const userRoleLower = (userRole || '').toLowerCase();
  const isManager = ['diretor', 'coordenador', 'escrivão', 'agente'].some(role => userRoleLower.includes(role));

  const filteredCourses = courses.filter(course => 
    course.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <BookOpen className="text-federal-500" />
            Gestão de Cursos
          </h1>
          <p className="text-slate-400 text-sm mt-1">Gerencie os cursos e especializações da corporação</p>
          <div className="text-xs text-slate-500 mt-1 bg-slate-800 p-1 rounded inline-block">
            Debug Role: {userRole || 'Carregando...'} | Manager: {isManager ? 'Sim' : 'Não'}
          </div>
        </div>

        {isManager && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-federal-600 hover:bg-federal-500 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
          >
            <Plus size={18} />
            Novo Curso
          </button>
        )}
      </div>

      <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 w-full md:max-w-md">
        <Search className="text-slate-500" size={18} />
        <input
          type="text"
          placeholder="Buscar cursos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent border-none focus:outline-none text-slate-200 ml-2 w-full placeholder-slate-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course List */}
        <div className="lg:col-span-1 space-y-4">
          {loading ? (
            <div className="text-center py-8 text-slate-500">Carregando cursos...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800 border-dashed">
              Nenhum curso encontrado
            </div>
          ) : (
            filteredCourses.map(course => (
              <div
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className={`
                  p-4 rounded-xl border cursor-pointer transition-all hover:border-federal-500/50 group relative
                  ${selectedCourse?.id === course.id 
                    ? 'bg-federal-900/20 border-federal-500 ring-1 ring-federal-500/50' 
                    : 'bg-slate-900 border-slate-800 hover:bg-slate-800/50'}
                `}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-bold text-white group-hover:text-federal-400 transition-colors">
                      {course.nome}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                      {course.descricao || 'Sem descrição'}
                    </p>
                  </div>
                  {isManager && (
                    <button
                      onClick={(e) => handleDeleteCourse(course.id, e)}
                      className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                      title="Excluir curso"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Course Details */}
        <div className="lg:col-span-2">
          {selectedCourse ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full min-h-[400px]">
              <div className="p-6 border-b border-slate-800 bg-slate-900/50">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                      <GraduationCap className="text-federal-500" />
                      {selectedCourse.nome}
                    </h2>
                    <p className="text-slate-400 mt-2 text-sm">{selectedCourse.descricao}</p>
                  </div>
                  {isManager && (
                    <button
                      onClick={openAssignModal}
                      className="flex items-center gap-2 bg-federal-600/10 hover:bg-federal-600/20 text-federal-400 hover:text-federal-300 px-3 py-1.5 rounded-lg transition-all text-sm font-medium border border-federal-600/20"
                    >
                      <UserPlus size={16} />
                      Atribuir Policial
                    </button>
                  )}
                </div>
              </div>

              <div className="p-6 flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Users size={14} />
                  Policiais Habilitados ({assignments.length})
                </h3>

                {assignments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-sm">
                    <ShieldAlert size={32} className="mb-3 opacity-20" />
                    <p>Nenhum policial possui este curso.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {assignments.map((assignment) => (
                      <div 
                        key={assignment.id} 
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">
                            {assignment.profiles?.full_name?.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">
                              {assignment.profiles?.full_name}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase">
                              {assignment.profiles?.role}
                            </p>
                          </div>
                        </div>
                        
                        {isManager && (
                          <button
                            onClick={() => handleRemoveAssignment(assignment.id)}
                            className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-500/10 rounded"
                            title="Remover curso"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 border border-slate-800 border-dashed rounded-xl bg-slate-900/20 min-h-[400px]">
              <BookOpen size={48} className="mb-4 opacity-20" />
              <p>Selecione um curso para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Criar Novo Curso</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Curso</label>
                <input
                  type="text"
                  required
                  value={newCourse.nome}
                  onChange={e => setNewCourse({...newCourse, nome: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-federal-500 focus:outline-none"
                  placeholder="Ex: Táticas Especiais"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Descrição</label>
                <textarea
                  rows="3"
                  value={newCourse.descricao}
                  onChange={e => setNewCourse({...newCourse, descricao: e.target.value})}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-federal-500 focus:outline-none"
                  placeholder="Detalhes sobre o curso..."
                />
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-federal-600 hover:bg-federal-500 rounded-lg transition-colors"
                >
                  Criar Curso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-md p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">Atribuir Curso</h3>
              <button onClick={() => setShowAssignModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAssignCourse} className="space-y-4">
              <div className="p-3 bg-federal-900/20 border border-federal-900/50 rounded-lg mb-4">
                <p className="text-sm text-federal-200">
                  Atribuindo: <span className="font-bold">{selectedCourse?.nome}</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Selecionar Policial</label>
                <select
                  required
                  value={selectedOfficer}
                  onChange={e => setSelectedOfficer(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white focus:border-federal-500 focus:outline-none"
                >
                  <option value="">Selecione...</option>
                  {officers.map(officer => (
                    <option key={officer.id} value={officer.id}>
                      {officer.full_name} ({officer.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-bold text-white bg-federal-600 hover:bg-federal-500 rounded-lg transition-colors"
                >
                  Atribuir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoursesSettings;
