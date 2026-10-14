#!/bin/sh
# Runs several parameter sets through both implementations and compares.
for P in \
 '{"n":50,"nExc":40,"prob":0.1,"excW":0.3,"inhW":0.6,"extW":0.5,"inputRate":0.1,"K":4,"bits":8,"vBits":16,"seed":42}' \
 '{"n":50,"nExc":40,"prob":0.1,"excW":0.3,"inhW":0.6,"extW":0.5,"inputRate":0.1,"K":3,"bits":4,"vBits":8,"seed":7}' \
 '{"n":50,"nExc":40,"prob":0.1,"excW":0.5,"inhW":1.5,"extW":0.5,"inputRate":0.2,"K":5,"bits":6,"vBits":8,"seed":123}'
do
  node dump.js "$P" > /tmp/js.json
  python3 reference.py "$P" > /tmp/py.json
  if cmp -s /tmp/js.json /tmp/py.json; then echo "MATCH   $P"; else echo "DIFFER  $P"; fi
done
