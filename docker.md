Pull official postgresql image
`docker pull postgres:16`

Create a named volume for PostgreSQL data
`docker volume create pgdata`

Run PostgreSQL with persistent storage

```
docker run --name devops-postgres \
-e POSTGRES_USER=devops \
-e POSTGRES_PASSWORD=devops \
-e POSTGRES_DB=devops_db \
-v pgdata:/var/lib/postgresql/data \
-p 1337:1337 \
-d postgres:16
```

Useful commands:

# Access psql shell

docker exec -it devops-postgres psql -U devops -d devops_db

# List tables in current database

\dt

# View logs

docker logs devops-postgres

# Check if PostgreSQL is ready

docker exec devops-postgres pg_isready -U devops

# View running queries

docker exec devops-postgres psql -U devops -d devops_db -c "SELECT * FROM pg_stat_activity;"

# Stop and remove the container (data persists in volume)

docker stop devops-postgres && docker rm devops-postgres

# Remove the volume (destroys all data)

docker volume rm pgdata

# Build container

docker build -f [folder]/Dockerfile -t [service]-service .

# Run the container

docker run -p 3000:3000 [service]-service
