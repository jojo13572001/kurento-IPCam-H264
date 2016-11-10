# kurento-IPCam-H264
IPCam RTSP streaming with H.264 video-only recording 

# Description
  My Server Environment is AWS and browser endpoint is under home router, so I have to build up stun/turn server.
  If you don't need, please skip stun/turn part bellow.
  
# Steps
1. Launch turn server (AWS instance 1)
   turnserver -a -o -v -n -u account:password -p 3478 -L privateIP -r someRealm -X PublicIP/PrivateIP --no-dtls --no-tls
   ex: turnserver -a -o -v -n -u ben:1234 -p 3478 -L 172.31.11.24 -r someRealm -X 54.192.181.145/172.31.11.24 --no-dtls --no-tls

2. Install kurento server 6.6.0 and setup stun/turn setting(AWS Instance 2)
   http://doc-kurento.readthedocs.io/en/stable/installation_guide.html

3. Put the project on the same instance (AWS Instance 2)
4. bash kurento.sh
5. http://publicIP:8443/
	
# Test Video Site
http://files.kurento.org/video/

# IPcam Access
Install RTSP Camera Server(Android App) and turn off audio.

#Comment
1. You can use video-audio/video-only/audio stream. Just modify the index.js
2. You can record the file as webm.
3. Currently I use secureless connection(ws) because there are problem with secure connection.
	
