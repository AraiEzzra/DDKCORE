# Epoch time

DDK timeservice uses UNIX format Epoch time for determining time of the blocks and other network events.

DDK has its own `epoch time`.
 
This epoch starts after `1451667600` seconds since [UNIX Epoch time](https://en.wikipedia.org/wiki/Unix_time).
 
Time of creation `block` or `transaction` measured in seconds since `DDK Epoch`.
 
This epoch time was designed to resolve the [problem of 2038 year](https://en.wikipedia.org/wiki/Year_2038_problem).
 
To get the UNIX time of block creation, you need to get the sum of block `createdAt` and `DDK Epoch time`
