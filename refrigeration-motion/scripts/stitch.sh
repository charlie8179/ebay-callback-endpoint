#!/usr/bin/env bash
# Stitches the rendered frames and the voiceover into the final 60 fps MP4.
set -euo pipefail
cd "$(dirname "$0")/.."
ffmpeg -loglevel error -y -framerate 60 -i out/frames/%05d.png -i audio/voiceover.wav \
  -c:v libx264 -preset slow -crf 18 -pix_fmt yuv420p -r 60 \
  -c:a aac -b:a 192k -movflags +faststart -shortest \
  out/refrigeration-cycle-60fps.mp4
ffprobe -v error -show_entries stream=codec_type,codec_name,width,height,r_frame_rate,nb_frames \
  -show_entries format=duration -of compact out/refrigeration-cycle-60fps.mp4
