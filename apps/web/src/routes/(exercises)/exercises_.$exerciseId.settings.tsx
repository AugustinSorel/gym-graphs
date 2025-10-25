import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute(
  '/(exercises)/exercises_/$exerciseId/settings',
)({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(exercises)/exercises_/$exerciseId/settings"!</div>
}
