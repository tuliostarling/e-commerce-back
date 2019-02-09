FROM node

ENV HOME='/usr/src/app'


WORKDIR $HOME
COPY ./ $HOME

RUN npm install && npm rebuild && npm audit fix && mkdir /etc/letsencrypt/
EXPOSE 3000

CMD [ "npm", "start" ]
