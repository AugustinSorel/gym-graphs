# gym-graphs

Gym Graphs allows users to track their gym progress with the help of graphs. The app allows users to add new exercises, organize their exercises with a dashboard and add new data for each exercise. The app will calculate an estimated one rep max given the number of repetitions and the weight lifted.

# Demo

live website: https://gym-graphs.com

# Image

<img width="1481" height="2720" alt="localhost_8000_exercises_34" src="https://github.com/user-attachments/assets/231d6886-8225-414c-8137-c1df6aae1af8" />

## Development

```bash
devenv up
```
## Production

```bash
docker build -t gym-graphs .

docker run -p 8000:8000 \
  -e PORT=8000 \
  -e DATABASE_URL="postgres://user:pass@host:5432/gym_graphs" \
  -e APP_ENV=production \
  -e AWS_REGION=eu-west-1 \
  -e AWS_ACCESS_KEY_ID=... \
  -e AWS_SECRET_ACCESS_KEY=... \
  -e SES_FROM_ADDRESS=no-reply@example.com \
  gym-graphs
```
