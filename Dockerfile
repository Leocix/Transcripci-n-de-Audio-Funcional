FROM node:18-slim

# Instala ffmpeg
RUN apt-get update \
  && apt-get install -y --no-install-recommends ffmpeg ca-certificates \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copiar package.json primero para aprovechar cache de docker
COPY package.json package-lock.json* ./

RUN npm install --production

# Copiar el resto del proyecto
COPY . /app

RUN mkdir -p /app/tmp

EXPOSE 3000

ENV NODE_ENV=production

CMD ["node", "server.js"]
