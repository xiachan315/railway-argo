FROM node:bookworm-slim

WORKDIR /tmp

COPY index.js index.html package.json ./

EXPOSE 3000/tcp

RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates curl openssl iproute2 coreutils bash procps && rm -rf /var/lib/apt/lists/*

RUN chmod +x index.js && npm install --omit=dev && node -e "require('koffi');console.log('koffi OK')"

CMD ["node", "index.js"]
