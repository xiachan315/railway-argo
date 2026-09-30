FROM node:24-slim

WORKDIR /tmp

COPY index.js index.html package.json ./

EXPOSE 3000/tcp

RUN apt-get update && apt-get upgrade -y && \
    apt-get install -y --no-install-recommends \
        openssl \
        curl \
        iproute2 \
        coreutils \
        bash \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* \
    && chmod +x index.js \
    && npm install

RUN sh -c 'curl -fsSL --max-time 300 -o /usr/local/bin/cf-probe https://github.com/huilang-me/cfsm-agent/releases/latest/download/cf-probe-linux-amd64 && chmod +x /usr/local/bin/cf-probe && ls -la /usr/local/bin/cf-probe || echo CFPROBE-DOWNLOAD-FAILED'

CMD ["node", "index.js"]
