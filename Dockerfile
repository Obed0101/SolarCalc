FROM nginx:alpine
COPY index.html /usr/share/nginx/html/
COPY model.glb /usr/share/nginx/html/
EXPOSE 80
