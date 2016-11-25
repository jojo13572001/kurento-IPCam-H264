#/bin/bash
sudo service kurento-media-server-6.0 stop
sleep 2
sudo service kurento-media-server-6.0 start
#http-server -p 8443 -S -C keys/defaultCertificate.pem -K keys/defaultCertificate.pem
http-server -p 8443
