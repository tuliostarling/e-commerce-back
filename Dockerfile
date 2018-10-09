FROM node:alpine

ENV HOME='/usr/src/app'

EXPOSE 3000

WORKDIR $HOME
COPY ./ $HOME

RUN npm install && npm rebuild

CMD [ "npm", "start" ]
 