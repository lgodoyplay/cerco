import React, { useState, useCallback } from 'react';

const FLUXER_URL = 'https://web.canary.fluxer.app/';

const FluxerFrame = () => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    setHasError(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const openInNewTab = useCallback(() => {
    window.open(FLUXER_URL, '_blank', 'noopener,noreferrer');
  }, []);

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 overflow-hidden">
        {hasError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-4 p-6 text-center">
            <div className="rounded-full border border-slate-700 bg-slate-900/60 p-4 text-slate-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-8 w-8"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-white">Não foi possível carregar o Fluxer aqui</h3>
              <p className="max-w-md text-sm text-slate-400">
                O cliente web do Fluxer bloqueou o carregamento incorporado por política de segurança. Use o botão abaixo para abri-lo em uma nova aba.
              </p>
            </div>
            <button
              onClick={openInNewTab}
              className="inline-flex items-center gap-2 rounded-full border border-federal-700 bg-federal-900/40 px-4 py-2 text-sm font-semibold text-federal-200 transition hover:bg-federal-800/60"
            >
              Abrir Fluxer em nova aba
            </button>
          </div>
        ) : (
          <iframe
            src={FLUXER_URL}
            title="Fluxer"
            allow="microphone; camera; display-capture; autoplay; fullscreen"
            onLoad={handleLoad}
            onError={handleError}
            className="h-full w-full border-0"
          />
        )}
      </div>

      {isLoading && !hasError && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/40">
          <div className="h-8 w-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
};

export default FluxerFrame;
