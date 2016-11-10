#/bin/bash
sudo service kurento-media-server-6.0 stop
sleep 2
sudo service kurento-media-server-6.0 start
#http-server -p 8443 -S -C keys/server.crt -K keys/server.key
http-server -p 8443
