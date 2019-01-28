FROM node:10-alpine

ENV HOME='/usr/src/app'

EXPOSE 3000

WORKDIR $HOME
COPY ./ $HOME

RUN npm install && npm rebuild && npm audit fix

CMD [ "npm", "start" ]
