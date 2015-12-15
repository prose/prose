FROM nodesource/trusty:4.2.1
MAINTAINER David A. Lareo <dalareo@gmail.com>

RUN git clone https://github.com/prose/prose /usr/src/app/
WORKDIR /usr/src/app
ENV NODE_ENV env

RUN npm install -g gulp
RUN npm install && mkdir -p dist && gulp
RUN npm install -g serve

EXPOSE 3000

CMD ["serve"]
