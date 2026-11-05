#!/bin/bash
cd "$(dirname "$0")"
declare -A L=( [happy]=2.4 [attentive]=3.2 [caringHigh]=3.2 [worriedHigh]=1.6 [caringLow]=3.2 [worriedLow]=1.6 [celebrate]=2.4 [sleep]=4 [confused]=3.2 [remind]=2.4 [sport]=0.8 [missYou]=3.2 )
for m in "${!L[@]}"; do
  n=$(python3 -c "print(round(${L[$m]}*20))")
  rm -rf "out/$m"; node frames.js "$m" "$n" "${L[$m]}" "out/$m" &
  while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 1; done
done
wait
echo done
