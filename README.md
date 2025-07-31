# Countries Information Overview

This repository contains a lightweight environment that hosts a website that utilizes APIs to help people know various information about countries they want to visit, relocate to, or research about; including statistics, culture, finances, holidays, and more.

You will see instructions on how to configure this environment locally using Docker to deploy it on multiple servers and configure a load balancer to efficiently route the traffic between them.

## Requirements

- Docker installed on your machine
- 2GBs of free RAM and 50MBs of disk space
- Internet connection

## Setup

1. Clone this repository
   ```bash
   git clone https://github.com/cyuzuzo-aime/country_information_overview.git
   cd country_information_overview
   ```
   If you just want to see the website in your browser, run `cd countries-information-website` and run the index.html.

   Otherwise, read the next instructions to run the docker environment
2. Bring up the lab environment (builds the images on first run):
   ```bash
   docker compose up -d --build
   ```
3. Verify that the containers are running:
   ```bash
   docker compose ps
   ```
   You should see `web-01`, `web-02`, and `lb-01` online. The services are attached to the `lablan` network with the following addresses:

   | Container | IP           | Exposed Ports |
   |---------- |------------- |---------------|
   | web-01    | 172.20.0.11  | 2211 (SSH), 8080 (HTTP) |
   | web-02    | 172.20.0.12  | 2212 (SSH), 8081 (HTTP) |
   | lb-01     | 172.20.0.10  | 2210 (SSH), 8082 (HTTP) |
4. Connect to `web-01` and configure the first server

   Open a new terminal and run this command. (Password: pass123)
   ```bash
   ssh ubuntu@localhost -p 2211
   ```

   Copy and paste this command in your web-01's terminal to install docker
   ```bash
   sudo apt update && sudo apt install docker.io
   ```

   Pull the docker image from Dockerhub
   ```bash
   sudo docker pull aimecyuzuzo/country-info-overview:v1
   ```

   Configure the image to be served locally:
   ```bash
   sudo docker create --name temp aimecyuzuzo/country-info-overview:v1 && sudo docker cp temp:/usr/share/nginx/html ./static-site && sudo docker rm temp && cd static-site && python3 -m http.server 8080 --bind 0.0.0.0
   ```
   Now go back to the terminal of your local machine.
   That's it.
5. Connect to `web-02` and configure it the same way as above

   Open a new terminal and run this command. (Password: pass123)
   ```bash
   ssh ubuntu@localhost -p 2211
   ```

   Copy and paste this command in your web-01's terminal to install docker
   ```bash
   sudo apt update && sudo apt install docker.io
   ```

   Pull the docker image from Dockerhub
   ```bash
   sudo docker pull aimecyuzuzo/country-info-overview:v1
   ```

   Configure the image to be served locally:
   ```bash
   sudo docker create --name temp aimecyuzuzo/country-info-overview:v1 && sudo docker cp temp:/usr/share/nginx/html ./static-site && sudo docker rm temp && cd static-site && python3 -m http.server 8080 --bind 0.0.0.0
   ```
   Now go back to the terminal of your local machine.
6. Configure the load balancer

   Open a new terminal, and run this command. (Password: pass123)
   ```bash
   ssh ubuntu@localhost -p 2210
   ```
   
   Run this command to install haproxy. HaProxy is a lightweight network traffic management tool that we will use to receive and balance requests we receive to the two servers we configured above.
   ```bash
   sudo apt update && sudo apt install haproxy
   ```

   Open the haproxy config file to use our custom port: 8080
   ```bash
   sudo nano /etc/haproxy/haproxy.cfg
   ```

   Delete everything in the file, and replace it with this
   ```bash
   global
       daemon
       maxconn 256

   defaults
        mode http
        timeout connect 5s
        timeout client  50s
        timeout server  50s

    frontend http-in
        bind *:80
        default_backend countryinfooverview

    backend countryinfooverview
        balance roundrobin
        server web01 172.20.0.11:8080 check
        server web02 172.20.0.12:8080 check
        http-response set-header X-Served-By %[srv_name]
    ```
    Save the file

   Run this command to restart haproxy server
   ```bash
   haproxy -f /etc/haproxy/haproxy.cfg &
   ```
7. Run a request through the load balancer

   While inside the load balancer server's terminal, run this command:
   ```bash
   curl -s -D - http://172.20.0.10/ -o /dev/null
   ```
   You should have a response that looks like this:
   ```bash
   HTTP/1.0 200 OK
   server: SimpleHTTP/0.6 Python/3.12.3
   date: Thu, 31 Jul 2025 20:58:20 GMT
   content-type: text/html
   content-length: 875
   last-modified: Thu, 31 Jul 2025 12:42:01 GMT
   x-served-by: web02
   connection: keep-alive
   ```

   `x-served-by` shows you which web server responded to your request. Run this command multiple times to see the result change between web01 and web02.
   If you closely look at the web01 and web02 terminals, you can see the logs when each one handles the request.