import React from 'react';
import {
  INVESTIGATION_STATUS,
  getStatusOptions,
  getStatusBadge,
  getNextStatusOptions,
  isValidStatusTransition
} from '../../constants/investigationConstants';

/**
 * StatusSelect - Seletor de status com cores e transições
 */
export const StatusSelect = ({ value, onChange, showAllOptions = false }) => {
  const options = showAllOptions
    ? getStatusOptions()
    : getNextStatusOptions(value);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">
        Status Atual
      </label>
      <div className="grid grid-cols-2 gap-2">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              value === option.value
                ? 'ring-2 ring-federal-500 ' +
                  Object.values(INVESTIGATION_STATUS).find(s => s.value === option.value)?.color
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
      {value && (
        <div className={`p-3 rounded-lg text-sm ${getStatusBadge(value)}`}>
          {Object.values(INVESTIGATION_STATUS).find(s => s.value === value)?.description}
        </div>
      )}
    </div>
  );
};

/**
 * StatusBadge - Exibir status com cor
 */
export const StatusBadge = ({ status }) => {
  const statusObj = Object.values(INVESTIGATION_STATUS).find(s => s.value === status);
  if (!statusObj) return null;

  return (
    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${statusObj.colorBadge}`}>
      {statusObj.label}
    </span>
  );
};

/**
 * StatusTimeline - Mostrar progresso de status
 */
export const StatusTimeline = ({ currentStatus }) => {
  const statuses = Object.values(INVESTIGATION_STATUS);
  const currentIndex = statuses.findIndex(s => s.value === currentStatus);

  return (
    <div className="flex items-center justify-between p-4 bg-slate-800 rounded-lg">
      {statuses.map((status, index) => (
        <React.Fragment key={status.value}>
          <div className="flex flex-col items-center">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
              index <= currentIndex
                ? status.color + ' text-white'
                : 'bg-slate-700 text-slate-500'
            }`}>
              {index + 1}
            </div>
            <span className="text-xs mt-2 text-slate-400 whitespace-nowrap">{status.label}</span>
          </div>
          {index < statuses.length - 1 && (
            <div className={`flex-1 h-1 mx-2 ${
              index < currentIndex
                ? 'bg-emerald-500'
                : 'bg-slate-700'
            }`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

export default StatusSelect;
