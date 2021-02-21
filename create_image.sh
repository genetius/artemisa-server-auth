#!/bin/bash

version=0.0.1

docker build --pull --rm -f "Dockerfile" -t genetiushub/artemisa-server-auth:$version "." &&
docker push genetiushub/artemisa-server-auth:$version
