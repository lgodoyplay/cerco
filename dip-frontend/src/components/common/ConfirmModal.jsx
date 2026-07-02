import React from 'react';

const ConfirmModal = ({ message, onConfirm, onCancel, confirmLabel = 'Confirmar', danger = true }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
    <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
      <p className="text-white font-medium mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-slate-800 transition-colors"
        >
          Cancelar
        </button>
        <button
          onClick={onConfirm}
          className={`px-4 py-2 rounded-xl text-white font-bold transition-colors ${danger ? 'bg-red-600 hover:bg-red-500' : 'bg-federal-600 hover:bg-federal-500'}`}
        >
          {confirmLabel}
        </button>
      </div>
    </div>
  </div>
);

export default ConfirmModal;
