import { AlertCircle, AlertTriangle, CheckCircle, Info, X } from 'lucide-react';
import clsx from 'clsx';

const styles = {
  success: {
    container: 'bg-emerald-950/70 border-emerald-500/30 text-emerald-100',
    title: 'Sucesso',
    icon: CheckCircle
  },
  error: {
    container: 'bg-red-950/70 border-red-500/30 text-red-100',
    title: 'Erro',
    icon: AlertCircle
  },
  warning: {
    container: 'bg-amber-950/70 border-amber-500/30 text-amber-100',
    title: 'Aviso',
    icon: AlertTriangle
  },
  info: {
    container: 'bg-sky-950/70 border-sky-500/30 text-sky-100',
    title: 'Informacao',
    icon: Info
  }
};

const NotificationBanner = ({
  notification,
  onClose,
  className = '',
  floating = false
}) => {
  if (!notification?.message) return null;

  const config = styles[notification.type] || styles.info;
  const Icon = config.icon;

  return (
    <div
      className={clsx(
        'rounded-2xl border px-4 py-3 flex items-start gap-3 shadow-lg',
        config.container,
        floating && 'fixed top-4 right-4 z-50 w-[calc(100%-2rem)] max-w-md',
        className
      )}
      role="status"
      aria-live="polite"
    >
      <Icon size={20} className="mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-semibold">{notification.title || config.title}</p>
        <p className="text-sm opacity-90">{notification.message}</p>
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="text-current/80 hover:text-current transition-colors"
          aria-label="Fechar aviso"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default NotificationBanner;
