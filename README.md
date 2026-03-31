# Gym Graphs

Gym Graphs allows users to track their gym progress with the help of graphs. The app allows users to add new exercises, organize their exercises with a dashboard and add new data for each exercise. The app will calculate an estimated one rep max given the number of repetitions and the weight lifted.

## Demo

- live website: https://gym-graphs.com

## Image

![home page of Gym Graphs](https://github.com/user-attachments/assets/3f590cbd-d95b-4983-a02e-ca0a9b97618f)

## Structure

```txt
├── apps
│   ├── api          # Effect HTTP backend
│   └── web          # TanStack Start frontend
├── packages
│   └── shared       # Shared Effect schemas and HTTP API contract
├── package.json
├── pnpm-lock.yaml
├── pnpm-workspace.yaml
├── README.md
└── tsconfig.json
```

## Setup

```bash
git clone https://github.com/augustinsorel/gym-graphs.git
cd gym-graphs
cp ./apps/api/.env.example ./apps/api/.env
```

### Dev

```bash
pnpm install
pnpm build

pnpm db push

pnpm lint && pnpm dev
```

### Prod

```bash
docker build --target api --tag gym_graphs_api .
docker build --target web --tag gym_graphs_web .
docker build --target migration --tag gym_graphs_migration .

docker run --name gym_graphs_migration --rm --env-file=./apps/api/.env --network gym-graphs_backend gym_graphs_migration

docker run -p 5000:5000 --name gym_graphs_api --rm --env-file=./apps/api/.env gym_graphs_api
docker run -p 3000:3000 --name gym_graphs_web --rm gym_graphs_web
```
