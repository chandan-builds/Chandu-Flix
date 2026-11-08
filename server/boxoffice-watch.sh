#!/usr/bin/env bash
set -u

container=boxoffice-runtime
package=com.fvvcl.flickverse.tv
activity=com.mgs.carparking.ui.login.splash.SplashActivity
failures=0

while true; do
  if ! docker inspect -f '{{.State.Running}}' "$container" 2>/dev/null | grep -qx true; then
    sleep 10
    continue
  fi
  if [ "$(docker exec "$container" getprop sys.boot_completed 2>/dev/null)" != 1 ]; then
    sleep 10
    continue
  fi
  if ! docker exec "$container" pidof "$package" >/dev/null 2>&1; then
    docker exec "$container" am start -f 0x10008000 -n "$package/$activity" >/dev/null 2>&1 || true
    failures=0
    sleep 15
    continue
  fi
  ip=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' "$container")
  timestamp=$(date +%s%3N)
  if curl -fsS --max-time 3 "http://$ip:7000/control?msg=verify&device_id=12345678901234567890&ts=$timestamp" | grep -Eiq '^[a-f0-9]{32}$'; then
    failures=0
  else
    failures=$((failures + 1))
    if [ "$failures" -ge 3 ]; then
      docker exec "$container" am force-stop "$package" >/dev/null 2>&1 || true
      docker exec "$container" am start -f 0x10008000 -n "$package/$activity" >/dev/null 2>&1 || true
      failures=0
    fi
  fi
  sleep 30
done
