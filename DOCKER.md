# 🐳 Docker - Sistema de Propostas

Este documento contém instruções para executar a aplicação usando Docker.

## 📋 Pré-requisitos

- Docker (versão 20.10 ou superior)
- Docker Compose (versão 2.0 ou superior)

## 🚀 Execução Rápida

### Opção 1: Usando Docker Compose (Recomendado)

```bash
# Build e execução em um comando
docker-compose up --build

# Ou em background
docker-compose up --build -d
```

### Opção 2: Usando o Script Automatizado

```bash
# Tornar o script executável (apenas na primeira vez)
chmod +x docker-build.sh

# Executar o script
./docker-build.sh
```

### Opção 3: Build Manual

```bash
# Build da imagem
docker build -t proposals-system:latest .

# Executar container
docker run -d -p 3000:80 --name proposals-system proposals-system:latest
```

## 🌐 Acesso à Aplicação

Após a execução, a aplicação estará disponível em:
- **URL**: http://localhost:3000
- **Health Check**: http://localhost:3000/health

## 🛠️ Comandos Úteis

### Gerenciamento de Containers

```bash
# Ver containers rodando
docker ps

# Ver logs da aplicação
docker-compose logs -f

# Parar aplicação
docker-compose down

# Parar e remover volumes
docker-compose down -v
```

### Debug e Desenvolvimento

```bash
# Acessar shell do container
docker exec -it proposals-system sh

# Ver logs em tempo real
docker logs -f proposals-system

# Rebuild sem cache
docker-compose build --no-cache
```

## 📁 Estrutura dos Arquivos Docker

```
ProposalsSystem/
├── Dockerfile              # Configuração multi-stage do Docker
├── .dockerignore           # Arquivos ignorados no build
├── nginx.conf              # Configuração do servidor Nginx
├── docker-compose.yml      # Orquestração dos serviços
├── docker-build.sh         # Script automatizado de build
└── DOCKER.md              # Este arquivo
```

## ⚙️ Configurações

### Portas
- **Aplicação**: 3000 (host) → 80 (container)
- **Nginx**: Configurado para servir arquivos estáticos

### Variáveis de Ambiente
- `NODE_ENV=production`

### Health Check
- Endpoint: `/health`
- Intervalo: 30s
- Timeout: 10s
- Retries: 3

## 🔧 Personalização

### Alterar Porta
Para alterar a porta de acesso, edite o arquivo `docker-compose.yml`:

```yaml
ports:
  - "8080:80"  # Altere 8080 para a porta desejada
```

### Configuração do Nginx
Para personalizar o Nginx, edite o arquivo `nginx.conf` e reconstrua a imagem.

## 🐛 Troubleshooting

### Problema: Porta já em uso
```bash
# Verificar qual processo está usando a porta
sudo lsof -i :3000

# Parar containers existentes
docker-compose down
```

### Problema: Erro de permissão
```bash
# Dar permissão ao script
chmod +x docker-build.sh
```

### Problema: Build falha
```bash
# Limpar cache do Docker
docker system prune -a

# Rebuild sem cache
docker-compose build --no-cache
```

## 📊 Monitoramento

### Verificar Status
```bash
# Status dos containers
docker-compose ps

# Health check
curl http://localhost:3000/health
```

### Logs
```bash
# Logs da aplicação
docker-compose logs proposals-app

# Logs do Nginx
docker exec proposals-system tail -f /var/log/nginx/access.log
```

## 🚀 Deploy em Produção

Para deploy em produção, considere:

1. **Variáveis de Ambiente**: Configure adequadamente as variáveis de ambiente
2. **HTTPS**: Configure certificados SSL no Nginx
3. **Domínio**: Configure o `server_name` no nginx.conf
4. **Recursos**: Ajuste limites de CPU e memória
5. **Backup**: Configure estratégias de backup dos dados

## 📝 Notas

- A aplicação usa build multi-stage para otimizar o tamanho da imagem final
- O Nginx está configurado com compressão gzip e cache otimizado
- Headers de segurança estão configurados
- Suporte completo a SPA (Single Page Application) com fallback para index.html
