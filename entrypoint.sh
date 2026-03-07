#!/bin/sh
set -eu

node /app/tts-service/dist/index.js &
NODE_PID=$!

nginx -g 'daemon off;' &
NGINX_PID=$!

terminate() {
  kill -TERM "$NODE_PID" "$NGINX_PID" 2>/dev/null || true
}

trap terminate INT TERM

while kill -0 "$NODE_PID" 2>/dev/null && kill -0 "$NGINX_PID" 2>/dev/null; do
  sleep 1
done

STATUS=0
if ! kill -0 "$NODE_PID" 2>/dev/null; then
  wait "$NODE_PID" || STATUS=$?
else
  wait "$NGINX_PID" || STATUS=$?
fi

terminate
wait "$NODE_PID" 2>/dev/null || true
wait "$NGINX_PID" 2>/dev/null || true

exit "$STATUS"
