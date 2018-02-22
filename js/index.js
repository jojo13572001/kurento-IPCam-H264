/*
* (C) Copyright 2014-2015 Kurento (http://kurento.org/)
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*
*/

var pipeline;
var webRtcPeer

function getopts(args, opts)
{
  var result = opts.default || {};
  args.replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { result[$1] = decodeURI($3); });

  return result;
};

var args = getopts(location.search,
{
  default:
  {
    //ws_uri: 'wss://' + location.hostname + ':8433/kurento',
    ws_uri: 'ws://' + location.hostname + ':30063/kurento',
    logo_uri: 'http://' + location.host + '/img/kurento-logo.png',
    file_uri: 'file:///tmp/recorder_demo.mp4', // file to be stored in media server
    ice_servers: undefined
  }
});

function setIceCandidateCallbacks(webRtcPeer, webRtcEp, onerror)
{
  webRtcPeer.on('icecandidate', function(candidate) {
    console.log("Local candidate:",candidate);

    candidate = kurentoClient.getComplexType('IceCandidate')(candidate);

    webRtcEp.addIceCandidate(candidate, onerror)
  });

  webRtcEp.on('OnIceCandidate', function(event) {
    var candidate = event.candidate;

    console.log("Remote candidate:",candidate);

    webRtcPeer.addIceCandidate(candidate, onerror);
  });
}


window.addEventListener('load', function(event) {
  console = new Console();

  kurentoClient.register('kurento-module-crowddetector')
  startStreaming(); 
  //startRecordButton.addEventListener('click', startPlaying);

});
  	
function startStreaming() {
  console.log("onClick");

  //kurentoClient.register('kurento-module-crowddetector')
  const RegionOfInterest       = kurentoClient.getComplexType('crowddetector.RegionOfInterest')
  const RegionOfInterestConfig = kurentoClient.getComplexType('crowddetector.RegionOfInterestConfig')
  const RelativePoint          = kurentoClient.getComplexType('crowddetector.RelativePoint')

  //var videoInput = document.getElementById("videoInput");
  var videoOutput = document.getElementById("videoOutput");

  showSpinner(videoOutput);

  var startRecordButton = document.getElementById('record');
  var stopRecordButton = document.getElementById("stop")

  var options = {
    //localVideo: videoInput,
    remoteVideo: videoOutput,
    useEncodedMedia: true 
  };

  if (args.ice_servers) {
    console.log("Use ICE servers: " + args.ice_servers);
    options.configuration = {
      iceServers : JSON.parse(args.ice_servers)
    };
  } else {
    console.log("Use freeice")
  }

  webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options, function(error)
  {
    if(error) return onError(error)

    this.generateOffer(onOffer)
  });

  function onOffer(error, offer) {
    if (error) return onError(error);

    console.log("Offer...");

    kurentoClient(args.ws_uri, function(error, client) {
      if (error) return onError(error);

      client.create('MediaPipeline', function(error, pipeline) {
        if (error) return onError(error);
        console.log("Got MediaPipeline");

        //Create Crowd Detector Parameters
        var options =
        {
            rois:
                [
                    RegionOfInterest({
                        id: 'roi1',
                        points:
                            [
                                RelativePoint({x: 0,   y: 0.3}),
                                RelativePoint({x: 1,   y: 0.3}),
                                RelativePoint({x: 1,   y: 1}),
                                RelativePoint({x: 0,   y: 1})
                            ],
                        regionOfInterestConfig: RegionOfInterestConfig({
                            occupancyLevelMin: 10,
                            occupancyLevelMed: 35,
                            occupancyLevelMax: 65,
                            occupancyNumFramesToEvent: 5,
                            fluidityLevelMin: 10,
                            fluidityLevelMed: 35,
                            fluidityLevelMax: 65,
                            fluidityNumFramesToEvent: 5,
                            sendOpticalFlowEvent: false,
                            opticalFlowNumFramesToEvent: 3,
                            opticalFlowNumFramesToReset: 3,
                            opticalFlowAngleOffset: 0
                        })
                    })
                ]
        }
        var elements =
        [
          {type: 'WebRtcEndpoint', params: {}},
          //{type: 'PlayerEndpoint', params: {uri : "rtsp://54.199.182.145:8554/480i.ts"}},
          //{type: 'PlayerEndpoint', params: {uri : "rtsp://54.199.182.145:8554/1.mpg"}},
          //{type: 'PlayerEndpoint', params: {uri : "rtsp://211.75.8.115:554/stream1", useEncodedMedia:true, mediaPipeline:pipeline}},
          {type: 'PlayerEndpoint', params: {uri : "rtsp://211.23.139.64:40003/CH001.sdp"}},
          //{type: 'PlayerEndpoint', params: {uri : "rtsp://172.20.3.64:5544/live0.264"}},
          //{type: 'PlayerEndpoint', params: {uri : "http://files.kurento.org/video/10sec/red.webm"}},
          //{type: 'PlayerEndpoint', params: {uri : "rtsp://58.115.71.8:5554/camera"}},
          {type: 'RecorderEndpoint', params: {uri : args.file_uri,mediaProfile: 'MP4_VIDEO_ONLY'}},
          {type: 'crowddetector.CrowdDetectorFilter', params: options}
        ]

        pipeline.create(elements, function(error, elements){
            if (error) return onError(error);
            console.log("Connecting...");

            var webRtc   = elements[0];
            var player   = elements[1];
            var recorder = elements[2];
            var crowddetector = elements[3];

            setIceCandidateCallbacks(webRtcPeer, webRtc, onError);

            webRtc.processOffer(offer, function(error, answer) {
              if (error) return onError(error);

              console.log("offer");

              webRtc.gatherCandidates(onError);
              webRtcPeer.processAnswer(answer);
            });

            crowddetector.on('CrowdDetectorDirection', function (data){
                console.log("Direction event received in roi " + data.roiID +
                    " with direction " + data.directionAngle);
            });

            crowddetector.on('CrowdDetectorFluidity', function (data){
                console.log("Fluidity event received in roi " + data.roiID +
                    ". Fluidity level " + data.fluidityPercentage +
                    " and fluidity percentage " + data.fluidityLevel);
            });

            crowddetector.on('CrowdDetectorOccupancy', function (data){
                console.log("Occupancy event received in roi " + data.roiID +
                    ". Occupancy level " + data.occupancyPercentage +
                    " and occupancy percentage " + data.occupancyLevel);
            });

            client.connect(player,  recorder, function(error) {
                if (error) return onError(error);

                client.connect(player, crowddetector, webRtc, function(error) {
                    if (error) return onError(error);
                    //before unload page
                    window.addEventListener('beforeunload', function(event) {
                                alert("reload page ");
                                recorder.stop();
                                player.stop();
                                pipeline.release();
                                webRtcPeer.dispose();
                                //videoInput.src = "";
                                videoOutput.src = "";
                                hideSpinner(videoOutput);
                    });

                    window.addEventListener('unload', function(event) {
                                alert("reload page ");
                                recorder.stop();
                                player.stop();
                                pipeline.release();
                                webRtcPeer.dispose();
                                //videoInput.src = "";
                                videoOutput.src = "";
                                hideSpinner(videoOutput);
                    });

                    console.log("Connected");

                    player.play(function(error) {
                        if (error) return onError(error);

                        console.log("play");

                        startRecordButton.addEventListener("click", function(event){
                            recorder.record(function(error) {
                                if (error) {
                                    console.log("record error "+ error);
                                    return onError(error);
                                }
                                console.log("record");
                                stopRecordButton.addEventListener("click", function(event){
                                    recorder.stop();
                                    player.stop();
                                    pipeline.release();
                                    webRtcPeer.dispose();
                                    //videoInput.src = "";
                                    videoOutput.src = "";

                                    hideSpinner(videoOutput);

                                    var playButton = document.getElementById('play');
                                    playButton.addEventListener('click', startPlaying);
                                });
                            });
                        });
                     });
                });
            });
        });//end of pipeline create
      });
    });
  }
}


function startPlaying()
{
  console.log("Start playing");

  var videoPlayer = document.getElementById('videoOutput');
  showSpinner(videoPlayer);

  var options = {
    remoteVideo: videoPlayer,
    useEncodedMedia:true
  };

  if (args.ice_servers) {
    console.log("Use ICE servers: " + args.ice_servers);
    options.configuration = {
      iceServers : JSON.parse(args.ice_servers)
    };
  } else {
    console.log("Use freeice")
  }

  var webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
  function(error)
  {
    if(error) return onError(error)

    this.generateOffer(onPlayOffer)
  });

  function onPlayOffer(error, offer) {
    if (error) return onError(error);

    kurentoClient(args.ws_uri, function(error, client) {
      if (error) return onError(error);

      client.create('MediaPipeline', function(error, pipeline) {
        if (error) return onError(error);

        pipeline.create('WebRtcEndpoint', function(error, webRtc) {
          if (error) return onError(error);

          setIceCandidateCallbacks(webRtcPeer, webRtc, onError)

          webRtc.processOffer(offer, function(error, answer) {
            if (error) return onError(error);

            webRtc.gatherCandidates(onError);

            webRtcPeer.processAnswer(answer);
          });

          var options = {uri : args.file_uri}

          pipeline.create("PlayerEndpoint", options, function(error, player) {
            if (error) return onError(error);

            player.on('EndOfStream', function(event){
              pipeline.release();
              videoPlayer.src = "";

              hideSpinner(videoPlayer);
            });

            player.connect(webRtc, function(error) {
              if (error) return onError(error);

              player.play(function(error) {
                if (error) return onError(error);
                console.log("Playing ...");
              });
            });

            document.getElementById("stop").addEventListener("click",
            function(event){
              pipeline.release();
              webRtcPeer.dispose();
              videoPlayer.src="";

              hideSpinner(videoPlayer);

            })
          });
        });
      });
    });
  };
}

function onError(error) {
  if(error) console.log(error);
}

function showSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].poster = 'img/transparent-1px.png';
    arguments[i].style.background = "center transparent url('img/spinner.gif') no-repeat";
  }
}

function hideSpinner() {
  for (var i = 0; i < arguments.length; i++) {
    arguments[i].src = '';
    arguments[i].poster = 'img/webrtc.png';
    arguments[i].style.background = '';
  }
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
  event.preventDefault();
  $(this).ekkoLightbox();
});
