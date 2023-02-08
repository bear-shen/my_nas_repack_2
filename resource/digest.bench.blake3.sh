#!/bin/bash
date_stamp=$(date +"%H%M%S.%N")
echo $date_stamp

#declare -A digests

target='/home/wwwnode/my_nas_repack/file/binary/b5/f3/39dc7743d202fef3e0e0763d6b0c.iso'
#target='/home/wwwnode/my_nas_repack/file/image/00/77/55b0dbb0991a5245c74eb4ae6bd3.jpg'

digests=(
'./b3sum_linux_x64_bin'
)

for i in ${!digests[@]}
do
    echo "$i:${digests[$i]}"
    pre_stamp=$(date +"%s.%N");

    ${digests[$i]} $target

    #for ((j=0;j<100;j++));do
    #   ${digests[$i]} $target > /dev/null
    #done

    now_stamp=$(date +"%s.%N");
    echo "$now_stamp - $pre_stamp" | bc
done

#(\d+):(.+?)\n(.+?)=(.+?)\n(.+?)\n

# .565316957
# .135911735

