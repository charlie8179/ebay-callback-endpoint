#!/usr/bin/env bash
# Renders key frames (intro build-up, then start / middle / end of every beat,
# then the finale) and tiles them into out/contact-sheet.png for inspection.
set -euo pipefail
cd "$(dirname "$0")/.."

TIMES=$(node -e '
  const tl = require("./src/timeline.js");
  const ts = [1.0, 2.6];
  for (const b of tl.beats) ts.push(b.voStart + 0.8, (b.voStart + b.voEnd) / 2, b.end - 0.6);
  ts.push(tl.repeatStart + 1.2);
  console.log(ts.sort((a, b) => a - b).map((t) => (Math.round(t * 60) / 60).toFixed(3)).join(","));
')
node scripts/render-frames.js --times "$TIMES"

ARGS=()
LABELS=()
for t in ${TIMES//,/ }; do ARGS+=(-i "out/sheet-frames/t$t.png"); LABELS+=("$t"); done
N=${#LABELS[@]}
FILTER=""
for i in "${!LABELS[@]}"; do
  FILTER+="[$i]scale=640:360,drawtext=text='t=${LABELS[$i]}s':x=10:y=h-th-10:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6[f$i];"
done
for i in "${!LABELS[@]}"; do FILTER+="[f$i]"; done
COLS=3
ROWS=$(( (N + COLS - 1) / COLS ))
FILTER+="xstack=inputs=$N:fill=white:layout="
LAYOUT=""
for i in $(seq 0 $((N - 1))); do
  LAYOUT+="$(( (i % COLS) * 640 ))_$(( (i / COLS) * 360 ))|"
done
FILTER+="${LAYOUT%|}"
ffmpeg -loglevel error -y "${ARGS[@]}" -filter_complex "$FILTER" out/contact-sheet.png
echo "out/contact-sheet.png: $N frames, ${COLS}x${ROWS}"
