#!/bin/bash
date_stamp=$(date +"%H%M%S.%N")
echo $date_stamp

#declare -A digests

target='/home/wwwnode/my_nas_repack/file/binary/b5/f3/39dc7743d202fef3e0e0763d6b0c.iso'
#target='/home/wwwnode/my_nas_repack/file/image/00/77/55b0dbb0991a5245c74eb4ae6bd3.jpg'

digests=(
'blake2b512'        'blake2s256'        'gost'              'md4'
'md5'               'rmd160'            'sha1'              'sha224'
'sha256'            'sha3-224'          'sha3-256'          'sha3-384'
'sha3-512'          'sha384'            'sha512'            'sha512-224'
'sha512-256'        'shake128'          'shake256'          'sm3'
)

for i in ${!digests[@]}
do
    echo "$i:${digests[$i]}"
    pre_stamp=$(date +"%s.%N");

    # openssl ${digests[$i]} -r $target > /dev/null
    xxh32 -H2 $target > /dev/null

    # for ((j=0;j<100;j++));do
    #   openssl ${digests[$i]} -r $target > /dev/null
    # done

    now_stamp=$(date +"%s.%N");
    echo "$now_stamp - $pre_stamp" | bc
done

#(\d+):(.+?)\n(.+?)=(.+?)\n(.+?)\n

# 0 blake2b512 6.468942299  7514a2facaa038501aaefb3412345cf159d3f476aaf1d79842b774558c1d09f4b2b599907da042bdfdfe12bef0d70f388e48282d128a5fe19ba2370337ac05fb
# 1 blake2s256 10.377755086  348e8a69d1d72140e9458f8f38ab88fa133c1da0f0cf8ca8fb5412fb60e15f9f
# 2 gost 3.528863771  041eed795e6452503d49136af14ef65a87bfafb8293fcfe5a63b9a45126411d6
# 3 md4 4.856106007  98fb8964eae41b756380a23151926641
# 4 md5 7.720891399  b5f339dc7743d202fef3e0e0763d6b0c
# 5 rmd160 17.907084663  8c3a5c5615a47b8f2e910bdf11703608432f6962
# 6 sha1 3.339512914  a2021f99e0b49d4af5c5b83a8bc6b8a664ad1bc0
# 7 sha224 3.534909168  a6f0073c11f5bb65c0a41afffa31b3940785570af2fbdffac55dab7a
# 8 sha256 3.548570332  041eed795e6452503d49136af14ef65a87bfafb8293fcfe5a63b9a45126411d6
# 9 sha3-224 11.785349290  d3bdb8729436801e3a058161482ac8ca42980cd1b8157949edeef0d1
# 10 sha3-256 12.411275291  759f61322da21c33933a95fd39cdbb103f7b7f4abf4a565af62121b2ce02f00d
# 11 sha3-384 15.887613553  4f673e0917c00e93c306c3618f0302cbad5b8cde749ab3bf812834e353a23b70b9012a5c0c0e99723ab1a5cab5fc5f68
# 12 sha3-512 22.344942764  f02dab003dfaebec7dafd4ee68526022fb0f968d8e07bdc5822c7093ad2d5aa309c9575a5b09524e60f14e5757bbb8f252131729dae1a14ba3d51cfdc65112c6
# 13 sha384 7.323487525  040315de5e9c0a0383f52f7d2f9edf67f9e7f4a43e8d39fe1fe35790c361ecc631343781314359e82414bce1ec559a7a
# 14 sha512 7.311710034  4e7f405029828f54bd3e2fff43ccbae62ced443f619cbeac705cea5bec45cce7303ed6da8370280fb73c0796a0b5eebbb9e9e3bb50cf4b81e9bdbda09d4488b1
# 15 sha512-224 7.311949489  0f4cbc5b1af2b68b2a074c73bdf265fe37865c91e5b6cb9230c87348
# 16 sha512-256 7.330185966  6e58f3ae5e143aa6c8522f75cf147e65745a967d66d98dbcde8366059b4c057e
# 17 shake128 10.320564373  fa72f677aa5555e6a3387f0385de840b
# 18 shake256 12.428502066  586c3925de4b210498d83f474dc74a71d690219fea22d2d697165b27c3b5fe3a
# 19 sm3 17.638445202  2fa5049e9abe04d28d60a601d90f7ea1b239aa496264c6a9aa5c57f38835bb7a


# 0:blake2b512  .412773533
# 1:blake2s256  .522962364
# 2:gost  .346343992
# 3:md4 .382717535
# 4:md5 .443562201
# 5:rmd160  .694182511
# 6:sha1  .339881651
# 7:sha224  .337672279
# 8:sha256  .345306563
# 9:sha3-224  .543717996
# 10:sha3-256 .556027120
# 11:sha3-384 .643077920
# 12:sha3-512 .808718547
# 13:sha384 .456441510
# 14:sha512 .439042961
# 15:sha512-224 .437124140
# 16:sha512-256 .432923100
# 17:shake128 .507265629
# 18:shake256 .560446267
# 19:sm3  .693768722
