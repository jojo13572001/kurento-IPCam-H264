#/bin/bash
sudo service kurento-media-server-6.0 stop
sleep 2
sudo service kurento-media-server-6.0 start
#cd kurento-tutorial-node/kurento-hello-world
#cd kurento-tutorial-js/kurento-recorder
#cd kurento-tutorial-js/kurento-rtsp2webrtc
#http-server -p 8443 -S -C keys/server.crt -K keys/server.key
http-server -p 8443
#npm start
