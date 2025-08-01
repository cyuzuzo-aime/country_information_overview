# Use a tiny web server image (nginx) that serves static files
FROM nginx:alpine

# Copy your site files into nginx's default folder
COPY . /usr/share/nginx/html

# Change nginx to listen on port 8080 instead of 80
RUN sed -i 's/listen       80;/listen       8080;/' /etc/nginx/conf.d/default.conf

# Expose port 8080 to the outside
EXPOSE 8080

# Replace Nginx config to listen on port 8080
RUN sed -i 's/80/8080/g' /etc/nginx/conf.d/default.conf

# Start nginx by default (already set in the base image)
CMD ["nginx", "-g", "daemon off;"]