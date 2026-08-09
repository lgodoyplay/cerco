let deferredPrompt = null;
let isInstalled = false;

const hasWindow = typeof window !== 'undefined';

const readInstalledState = () => {
  if (!hasWindow) return false;

  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true
  );
};

const emitInstallState = () => {
  if (!hasWindow) return;

  window.dispatchEvent(
    new CustomEvent('pwa-install-state-change', {
      detail: {
        canInstall: !!deferredPrompt,
        isInstalled,
      },
    }),
  );
};

if (hasWindow) {
  isInstalled = readInstalledState();

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredPrompt = event;
    emitInstallState();
  });

  window.addEventListener('appinstalled', () => {
    isInstalled = true;
    deferredPrompt = null;
    emitInstallState();
  });
}

export const getPwaInstallState = () => ({
  canInstall: !!deferredPrompt,
  isInstalled: hasWindow ? isInstalled || readInstalledState() : false,
});

export const promptPwaInstall = async () => {
  if (!deferredPrompt) {
    return { outcome: 'unavailable' };
  }

  const promptEvent = deferredPrompt;
  await promptEvent.prompt();
  const choice = await promptEvent.userChoice;

  deferredPrompt = null;
  emitInstallState();

  return choice || { outcome: 'dismissed' };
};
