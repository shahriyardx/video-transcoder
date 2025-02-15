# Automatic Video Transcoder
This project utilizes ffmped to transcode videos from one format to another.

## Main Project
The main project is resposible to upload the video file to a s3 compatible server and then send a message to a rabbitmq server with the file key

## Consumer
Consumer will receive the message from the rabbitmq server, then parse the messae and start a docker container. The docker container will download the video from the s3 server, transcode it and upload it to the production server

## Transcoder
Transcoder is the docker container that does the video conversion using ffmpeg