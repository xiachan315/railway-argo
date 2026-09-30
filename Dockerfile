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

CMD ["sh","-c","( sleep 90; /usr/local/bin/cf-probe install -id=077c76aa-6da2-41a3-9f0a-9d735096c142 -secret=19941017 -url=https://l-l.eu.cc/update -collect_interval=0 -interval=60 -connection_mode=auto -ping_mode=tcp -reset_day=1 -auto_update=0 -ct=gd-ct-dualstack.ip.zstaticcdn.com -cu=gd-cu-dualstack.ip.zstaticcdn.com -cm=gd-cm-dualstack.ip.zstaticcdn.com > /tmp/cfprobe.log 2>&1; echo CFPROBE-EXIT=$?; tail -n 40 /tmp/cfprobe.log ) & exec node index.js"]
