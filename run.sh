(docker network create --attachable artemisa_network || true ) &&

(docker container rm artemisa-server-auth -f || true ) &&


docker build --rm -f "Dockerfile" -t genetiushub/artemisa-server-auth:latest . &&

docker run -p 3001:3001 -e LISTEN_PORT=3001 \
 -e CLUSTER_TOKEN=super-secure-cluster-token \
 -e POSTGRES_USERNAME=postgres \
 -e POSTGRES_PASSWORD=12345 \
 -e POSTGRES_PORT=5432 \
 -e POSTGRES_HOST=db \
 -e POSTGRES_DATABASE=postgres \
 --name=artemisa-server-auth --network-alias=artemisa-server-auth --network=artemisa_network genetiushub/artemisa-server-auth:latest