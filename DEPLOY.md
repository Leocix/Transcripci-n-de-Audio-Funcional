# 🚀 Guía de Despliegue en Digital Ocean

## Opción 1: App Platform (Recomendado - Más Fácil)

### Paso 1: Preparar el Repositorio
```bash
# En tu carpeta del proyecto
git init
git add .
git commit -m "Initial commit"

# Crear repositorio en GitHub
# Ve a: https://github.com/new
# Crea un repositorio llamado: transcripcion-audio

# Subir código a GitHub
git remote add origin https://github.com/TU_USUARIO/transcripcion-audio.git
git branch -M main
git push -u origin main
```

### Paso 2: Desplegar en Digital Ocean App Platform

1. **Inicia sesión en Digital Ocean**: https://cloud.digitalocean.com/

2. **Ir a App Platform**:
   - Haz clic en "Apps" en el menú lateral
   - Clic en "Create App"

3. **Conectar GitHub**:
   - Selecciona "GitHub"
   - Autoriza a Digital Ocean
   - Selecciona tu repositorio `transcripcion-audio`
   - Branch: `main`

4. **Configurar la App**:
   - **Nombre**: transcripcion-audio
   - **Region**: New York (o la más cercana)
   - **Plan**: Basic ($5/mes) o Dev ($0/mes para pruebas)

5. **Variables de Entorno**:
   ```
   HUGGINGFACE_API_KEY = tu_token_de_hugging_face
   PORT = 3000
   ```

6. **Configuración de Construcción** (Auto-detectado):
   - Build Command: `npm install`
   - Run Command: `node server.js`
   - HTTP Port: 3000

7. **Clic en "Create Resources"**

8. **Esperar 5-10 minutos** - La app se desplegará automáticamente

9. **Obtén tu URL**: `https://transcripcion-audio-xxxxx.ondigitalocean.app`

### Costos Estimados
- **Dev Plan**: GRATIS (ideal para pruebas, limita recursos)
- **Basic Plan**: $5/mes (512 MB RAM, 1 vCPU)
- **Professional**: $12/mes (1 GB RAM, más recursos)

---

## Opción 2: Droplet con Docker (Para usuarios avanzados)

### Paso 1: Crear un Droplet

1. Ve a: https://cloud.digitalocean.com/droplets/new
2. Selecciona:
   - **Image**: Ubuntu 22.04 LTS
   - **Plan**: Basic ($6/mes - 1GB RAM)
   - **Datacenter**: New York o Frankfurt
   - **Authentication**: SSH Key (recomendado) o Password

### Paso 2: Conectarse al Droplet

```bash
ssh root@TU_IP_DEL_DROPLET
```

### Paso 3: Instalar Docker

```bash
# Actualizar sistema
apt update && apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Instalar Docker Compose
apt install docker-compose -y

# Verificar instalación
docker --version
docker-compose --version
```

### Paso 4: Clonar el Proyecto

```bash
# Instalar Git
apt install git -y

# Clonar repositorio
git clone https://github.com/TU_USUARIO/transcripcion-audio.git
cd transcripcion-audio
```

### Paso 5: Configurar Variables de Entorno

```bash
# Crear archivo .env
nano .env
```

Agregar:
```
HUGGINGFACE_API_KEY=tu_token_aqui
PORT=3000
```

Guardar: `Ctrl+O`, `Enter`, `Ctrl+X`

### Paso 6: Construir y Ejecutar

```bash
# Construir y ejecutar con Docker Compose
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Verificar que está corriendo
docker ps
```

### Paso 7: Configurar Firewall

```bash
# Permitir tráfico HTTP y HTTPS
ufw allow 3000/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow ssh
ufw enable
```

### Paso 8: Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
apt install nginx -y

# Crear configuración
nano /etc/nginx/sites-available/transcripcion
```

Agregar:
```nginx
server {
    listen 80;
    server_name TU_DOMINIO.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Activar sitio
ln -s /etc/nginx/sites-available/transcripcion /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Paso 9: SSL con Let's Encrypt (HTTPS)

```bash
# Instalar Certbot
apt install certbot python3-certbot-nginx -y

# Obtener certificado SSL
certbot --nginx -d TU_DOMINIO.com

# Auto-renovación (ya configurada automáticamente)
certbot renew --dry-run
```

---

## 🔄 Actualizar la Aplicación

### En App Platform:
1. Haz cambios en tu código local
2. `git add .`
3. `git commit -m "Descripción de cambios"`
4. `git push`
5. Digital Ocean desplegará automáticamente

### En Droplet:
```bash
ssh root@TU_IP

cd transcripcion-audio
git pull
docker-compose down
docker-compose up -d --build
```

---

## 📊 Monitoreo

### Ver logs en tiempo real:
```bash
# App Platform: Ve a tu app → "Runtime Logs"

# Droplet:
docker-compose logs -f
```

### Verificar estado:
```bash
docker-compose ps
```

### Reiniciar:
```bash
docker-compose restart
```

---

## 🆘 Solución de Problemas

### La app no inicia:
```bash
# Ver logs
docker-compose logs

# Verificar variables de entorno
cat .env

# Reconstruir
docker-compose down
docker-compose up --build
```

### Error de puerto ocupado:
```bash
# Cambiar PORT en .env a otro (ej: 8080)
# Reconstruir
```

### Sin espacio en disco:
```bash
# Limpiar contenedores antiguos
docker system prune -a
```

---

## 💰 Costos Comparados

| Servicio | Plan | Precio/mes | RAM | Notas |
|----------|------|------------|-----|-------|
| **App Platform Dev** | Gratis | $0 | 512MB | Ideal para pruebas |
| **App Platform Basic** | Básico | $5 | 512MB | Producción ligera |
| **Droplet Basic** | Básico | $6 | 1GB | Más control, Docker |
| **Droplet Professional** | Pro | $12 | 2GB | Alta disponibilidad |

**Recomendación**: Empieza con App Platform Dev (gratis) para pruebas, luego sube a Basic ($5/mes).
