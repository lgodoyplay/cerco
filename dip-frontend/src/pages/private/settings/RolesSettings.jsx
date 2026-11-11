import React, { useState } from 'react';
import { useSettings } from '../../../hooks/useSettings';
import { BadgeCheck, Plus, Trash2, ArrowUp, ArrowDown, ChevronDown, ChevronUp } from 'lucide-react';
import { PERMISSION_GROUPS, PERMISSIONS } from '../../../hooks/usePermissions';

const createEmptyPermissionState = () => (
  PERMISSION_GROUPS.reduce((acc, group) => {
    acc[group.id] = group.permissions.reduce((inner, permission) => {
      inner[permission.id] = false;
      return inner;
    }, {});
    return acc;
  }, {})
);

const getRolePermissionState = (role = {}) => {
  const selectedPermissions = new Set(Array.isArray(role.permissions) ? role.permissions : []);

  return PERMISSION_GROUPS.reduce((acc, group) => {
    acc[group.id] = group.permissions.reduce((inner, permission) => {
      inner[permission.id] = selectedPermissions.has(permission.id);
      return inner;
    }, {});
    return acc;
  }, {});
};

const RolesSettings = () => {
  const { roles, updateRoles, logAction } = useSettings();
  const [newRole, setNewRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [newRolePermissions, setNewRolePermissions] = useState(createEmptyPermissionState());
  const [expandedRoleId, setExpandedRoleId] = useState(null);

  const PermissionGroupAccordion = ({ group, groupState, onToggleGroup, onTogglePermission, defaultOpen = true }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);
    const selectedCount = group.permissions.filter((permission) => groupState?.[permission.id]).length;
    const isAllSelected = group.permissions.length > 0 && group.permissions.every((permission) => groupState?.[permission.id]);

    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/80 overflow-hidden">
        <div
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full flex items-center justify-between gap-3 px-3 py-3 text-left hover:bg-slate-800/70 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={(event) => onToggleGroup(event.target.checked)}
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-federal-500 focus:ring-federal-500"
            />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-200 truncate">{group.label}</span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-slate-500">{group.permissions.length} itens</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{selectedCount} selecionado{selectedCount !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="border-t border-slate-700 bg-slate-950/50 p-3 space-y-2">
            {group.permissions.map((permission) => (
              <label
                key={permission.id}
                className="flex cursor-pointer items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-300 hover:border-slate-600 transition-colors"
                onClick={(event) => event.stopPropagation()}
              >
                <span className="font-medium">{permission.label}</span>
                <input
                  type="checkbox"
                  checked={Boolean(groupState?.[permission.id])}
                  onChange={() => onTogglePermission(permission.id)}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  className="h-4 w-4 rounded border-slate-500 bg-slate-900 text-federal-500 focus:ring-federal-500"
                />
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };

  const updateGroupSelection = (state, groupId, checked) => {
    const group = PERMISSION_GROUPS.find((item) => item.id === groupId);
    if (!group) return state;

    const nextState = { ...state };
    nextState[groupId] = group.permissions.reduce((acc, permission) => {
      acc[permission.id] = checked;
      return acc;
    }, {});
    return nextState;
  };

  const toggleNewRolePermission = (groupId, permissionId) => {
    setNewRolePermissions((prev) => ({
      ...prev,
      [groupId]: {
        ...prev[groupId],
        [permissionId]: !prev[groupId]?.[permissionId]
      }
    }));
  };

  const toggleRoleGroup = async (roleId, groupId, checked) => {
    const updatedRoles = roles.map((role) => {
      if (role.id !== roleId) return role;

      const group = PERMISSION_GROUPS.find((item) => item.id === groupId);
      const nextPermissions = new Set(Array.isArray(role.permissions) ? role.permissions : []);
      group.permissions.forEach((permission) => {
        if (checked) {
          nextPermissions.add(permission.id);
        } else {
          nextPermissions.delete(permission.id);
        }
      });

      return { ...role, permissions: Array.from(nextPermissions) };
    });

    await updateRoles(updatedRoles);
    logAction('Permissões do cargo atualizadas');
  };

  const toggleRolePermission = async (roleId, groupId, permissionId) => {
    const updatedRoles = roles.map((role) => {
      if (role.id !== roleId) return role;
      const nextPermissions = new Set(Array.isArray(role.permissions) ? role.permissions : []);
      if (nextPermissions.has(permissionId)) {
        nextPermissions.delete(permissionId);
      } else {
        nextPermissions.add(permissionId);
      }
      return { ...role, permissions: Array.from(nextPermissions) };
    });

    await updateRoles(updatedRoles);
    logAction('Permissão do cargo alterada');
  };

  const handleAddRole = async (e) => {
    e.preventDefault();
    if (!newRole.trim()) return;

    setLoading(true);
    try {
      const nextHierarchy = roles.length > 0 ? Math.max(...roles.map((role) => role.hierarchy || 0)) + 1 : 1;
      const selectedPermissions = Object.entries(newRolePermissions).flatMap(([groupId, permissionsById]) => {
        const group = PERMISSION_GROUPS.find((item) => item.id === groupId);
        if (!group) return [];
        return group.permissions
          .filter((permission) => permissionsById?.[permission.id])
          .map((permission) => permission.id);
      });

      const newRoleObj = {
        id: Date.now(),
        title: newRole.trim(),
        hierarchy: nextHierarchy,
        permissions: [...new Set(selectedPermissions)]
      };

      const updatedRoles = [...roles, newRoleObj];
      await updateRoles(updatedRoles);

      logAction(`Novo cargo criado: ${newRole.trim()}`);
      setNewRole('');
      setNewRolePermissions(createEmptyPermissionState());
    } catch (error) {
      console.error('Erro ao adicionar cargo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveRole = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover este cargo?')) return;
    const updatedRoles = roles.filter((role) => role.id !== id);
    await updateRoles(updatedRoles);
    logAction(`Cargo removido: ID ${id}`);
  };

  const moveRole = async (index, direction) => {
    const newRoles = [...roles];
    const [movedRole] = newRoles.splice(index, 1);
    newRoles.splice(index + direction, 0, movedRole);
    const updatedRoles = newRoles.map((role, idx) => ({ ...role, hierarchy: idx + 1 }));
    await updateRoles(updatedRoles);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <BadgeCheck className="text-federal-500" size={28} />
          Cargos & Patentes
        </h2>
        <p className="text-slate-400 mt-1">Crie cargos e atribua permissões por categoria e subcategoria.</p>
      </div>

      <div className="bg-slate-950 border border-slate-800 rounded-xl p-6">
        <form onSubmit={handleAddRole} className="space-y-5 mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="flex-1 px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-600 focus:border-federal-500 outline-none"
              placeholder="Nome do Cargo / Patente (ex: Agente Especial)"
            />
            <button
              type="submit"
              disabled={loading || !newRole.trim()}
              className="bg-federal-600 hover:bg-federal-500 text-white px-6 rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Plus size={20} />
              )}
              {loading ? 'Salvando...' : 'Adicionar'}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-300">Permissões do cargo</h3>
              <button
                type="button"
                onClick={() => setNewRolePermissions(createEmptyPermissionState())}
                className="text-xs text-slate-400 hover:text-white"
              >
                Limpar
              </button>
            </div>

            <div className="space-y-3">
              {PERMISSION_GROUPS.map((group) => {
                const groupState = newRolePermissions[group.id] || {};

                return (
                  <PermissionGroupAccordion
                    key={group.id}
                    group={group}
                    groupState={groupState}
                    onToggleGroup={(checked) => setNewRolePermissions((prev) => updateGroupSelection(prev, group.id, checked))}
                    onTogglePermission={(permissionId) => toggleNewRolePermission(group.id, permissionId)}
                    defaultOpen={true}
                  />
                );
              })}
            </div>
          </div>
        </form>

        <div className="space-y-3">
          {roles.slice().sort((a, b) => (a.hierarchy || 0) - (b.hierarchy || 0)).map((role, index) => {
            const rolePermissionState = getRolePermissionState(role);
            const isExpanded = expandedRoleId === role.id;
            const adminPermissionOnRole = Boolean(rolePermissionState.admin?.[PERMISSIONS.ADMIN_ACCESS]);

            return (
              <div key={role.id} className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex flex-col gap-4 md:flex-row md:items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveRole(index, -1)}
                        disabled={index === 0}
                        className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        onClick={() => moveRole(index, 1)}
                        disabled={index === roles.length - 1}
                        className="text-slate-500 hover:text-white disabled:opacity-30 transition-colors"
                      >
                        <ArrowDown size={16} />
                      </button>
                    </div>

                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-xs text-slate-400 border border-slate-700">
                      {role.hierarchy || index + 1}
                    </div>
                  </div>

                  <div className="flex-1">
                    <h3 className="text-white font-bold">{role.title}</h3>
                    <p className="text-xs text-slate-400">
                      {adminPermissionOnRole
                        ? 'Acesso administrativo ativo'
                        : Array.isArray(role.permissions) && role.permissions.length > 0
                          ? `${role.permissions.length} permissões atribuídas`
                          : 'Sem permissões atribuídas'}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedRoleId(isExpanded ? null : role.id)}
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-200 hover:border-federal-500 hover:text-white"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      {isExpanded ? 'Ocultar' : 'Permissões'}
                    </button>

                    <button
                      onClick={() => handleRemoveRole(role.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-500/10"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                    <div className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Permissões por categoria</div>
                    <div className="space-y-3">
                      {PERMISSION_GROUPS.map((group) => (
                        <PermissionGroupAccordion
                          key={`${role.id}-${group.id}`}
                          group={group}
                          groupState={rolePermissionState[group.id] || {}}
                          onToggleGroup={(checked) => toggleRoleGroup(role.id, group.id, checked)}
                          onTogglePermission={(permissionId) => toggleRolePermission(role.id, group.id, permissionId)}
                          defaultOpen={false}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RolesSettings;
