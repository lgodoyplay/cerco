# Guia de Deploy - Sistema Polícia Federal - DPF

Este projeto foi preparado para deploy escalável e profissional.

## Pré-requisitos
- Um servidor VPS (DigitalOcean, AWS, Linode, etc.) com Ubuntu 20.04 ou superior.
- Acesso SSH ao servidor.
- Domínio configurado (opcional, mas recomendado).

## 1. Preparação do Servidor

Acesse seu servidor via SSH e atualize os pacotes:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl git unzip -y
```

### Instalar Node.js (v18 ou v20)
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

### Instalar PM2 (Gerenciador de Processos)
```bash
sudo npm install -g pm2
```

### Instalar Nginx (Servidor Web)
```bash
sudo apt install nginx -y
```

## 2. Configuração do Projeto

Clone seu repositório ou suba os arquivos para o servidor (ex: `/var/www/dpf-system`).

```bash
mkdir -p /var/www/dpf-system
# Use git clone ou SCP/SFTP para enviar os arquivos
cd /var/www/dpf-system
```

### Backend Setup
```bash
cd dip-backend
npm install

# Gerar o cliente Prisma
npx prisma generate

# Criar arquivo .env (copie do local ou crie novo)
echo "DATABASE_URL=\"file:./dev.db\"" > .env
echo "JWT_SECRET=\"sua_chave_secreta_super_segura\"" >> .env
echo "PORT=3000" >> .env

# Criar pasta de uploads se não existir
mkdir -p uploads

# Build do Backend (se estiver usando TypeScript compilado)
# Se for rodar direto com ts-node em dev, pule. Para prod:
npm run build 
# (Certifique-se de que o package.json tem script de build, ex: "tsc")
```

### Frontend Setup
```bash
cd ../dip-frontend
npm install

# Configurar variável de ambiente para produção
# Crie um arquivo .env.production
echo "VITE_API_URL=http://SEU_IP_OU_DOMINIO/api" > .env.production

# Build do Frontend
npm run build
```

## 3. Configurando o Nginx

Crie um arquivo de configuração para o site:

```bash
sudo nano /etc/nginx/sites-available/dip-system
```

Cole o seguinte conteúdo (ajuste o domínio/IP):

```nginx
server {
    listen 80;
    server_name SEU_IP_OU_DOMINIO;

    # Frontend (Arquivos Estáticos)
    location / {
        root /var/www/dpf-system/dip-frontend/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend (API Proxy)
    location /api/ {
        proxy_pass http://localhost:3000/; # Porta do backend
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # Aumentar limite de upload para arquivos/fotos
        client_max_body_size 50M;
    }

    # Arquivos Estáticos do Backend (Uploads/Fotos)
    location /uploads/ {
        alias /var/www/dpf-system/dip-backend/uploads/;
        autoindex off;
    }
}
```

Ative o site e reinicie o Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/dip-system /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default # Remove o padrão se existir
sudo nginx -t # Testa a configuração
sudo systemctl restart nginx
```

## 4. Iniciando o Backend com PM2

```bash
cd /var/www/dip-system/dip-backend

# Iniciar o servidor (ajuste para o arquivo principal, ex: dist/server.js ou src/server.ts com interpreter)
# Opção 1 (Compilado JS):
pm2 start dist/server.js --name "dip-backend"

# Opção 2 (TypeScript direto - não recomendado para alta performance mas funciona):
pm2 start src/server.ts --name "dip-backend" --interpreter ./node_modules/.bin/ts-node

# Salvar lista de processos para iniciar no boot
pm2 save
pm2 startup
```

## 5. Manutenção e Logs

- Ver logs do backend: `pm2 logs dip-backend`
- Reiniciar backend: `pm2 restart dip-backend`
- Atualizar código:
  1. `git pull`
  2. Frontend: `npm run build`
  3. Backend: `npm run build` && `pm2 restart dip-backend`

## Observações Importantes

1. **Permissões**: Certifique-se que o usuário do Nginx (geralmente `www-data`) ou o usuário rodando o Node tem permissão de escrita na pasta `dip-backend/prisma` (para o SQLite) e `dip-backend/uploads`.
   ```bash
   sudo chown -R $USER:www-data /var/www/dpf-system/dip-backend/uploads
   sudo chmod -R 775 /var/www/dpf-system/dip-backend/uploads
   sudo chown -R $USER:www-data /var/www/dpf-system/dip-backend/prisma
   ```

2. **Segurança**: Configure o Firewall (UFW) para permitir apenas portas 22 (SSH), 80 (HTTP) e 443 (HTTPS).
   ```bash
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   ```
