#!/bin/bash
date_stamp=$(date +"%H%M%S.%N")
echo $date_stamp

#declare -A digests

#target='/home/wwwnode/my_nas_repack/file/binary/b5/f3/39dc7743d202fef3e0e0763d6b0c.iso'
target='/home/wwwnode/my_nas_repack/file/image/00/77/55b0dbb0991a5245c74eb4ae6bd3.jpg'

digests=(
'xxh32sum'        'xxh128sum'        'xxh64sum'              'xxhsum'
)

for i in ${!digests[@]}
do
    echo "$i:${digests[$i]}"
    pre_stamp=$(date +"%s.%N");

    # ${digests[$i]} -H2 $target

    for ((j=0;j<100;j++));do
       ${digests[$i]} -H2 $target > /dev/null
    done

    now_stamp=$(date +"%s.%N");
    echo "$now_stamp - $pre_stamp" | bc
done

#(\d+):(.+?)\n(.+?)=(.+?)\n(.+?)\n

# 0:xxh32sum  # .882661789
# 1:xxh128sum # .874113445
# 2:xxh64sum  # .870451523
# 3:xxhsum  # .871982049

# 0:xxh32sum  .103233363
# 1:xxh128sum .100784957
# 2:xxh64sum  .100993814
# 3:xxhsum  .100501049