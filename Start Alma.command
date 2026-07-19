#!/bin/zsh
# Double-click to start Alma. Keep this window open while using the app.
cd "$(dirname "$0")"
PORT=8741
( sleep 1; open "http://localhost:$PORT" ) &
echo "Alma is running at http://localhost:$PORT"
echo "Close this window (or press Ctrl+C) to stop."
python3 -m http.server $PORT
