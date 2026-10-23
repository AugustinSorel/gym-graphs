import gym_graphs/domains/weight.{type Weight}

pub type WeeklySummary {
  WeeklySummary(
    total_volume: Weight,
    total_sets: Int,
    total_weight: Weight,
    exercises_count: Int,
  )
}
