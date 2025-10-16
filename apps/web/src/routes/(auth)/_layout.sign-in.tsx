import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(auth)/_layout/sign-in')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(auth)/_layout/sign-in"!</div>
}
