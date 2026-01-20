import { useEffect } from 'react';

const TARGET_DOMAIN = 'dpfinterlagorp.com';

const DomainEnforcer = () => {
  useEffect(() => {
    // Verificar se estamos em ambiente de produção (ou se devemos forçar o redirecionamento)
    // Evitamos redirecionar em localhost para não quebrar o desenvolvimento
    const hostname = window.location.hostname;
    
    const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.includes('192.168.');
    const isTargetDomain = hostname === TARGET_DOMAIN || hostname === `www.${TARGET_DOMAIN}`;

    if (!isLocalhost && !isTargetDomain) {
      console.log(`Redirecionando de ${hostname} para ${TARGET_DOMAIN}...`);
      const newUrl = `https://${TARGET_DOMAIN}${window.location.pathname}${window.location.search}${window.location.hash}`;
      window.location.replace(newUrl);
    }
  }, []);

  return null;
};

export default DomainEnforcer;
