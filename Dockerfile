FROM node:argon

# create app directory 
RUN mkdir -p /usr/src/app 
WORKDIR /usr/src/app 

#set startup commands
CMD ["node", "bot"]