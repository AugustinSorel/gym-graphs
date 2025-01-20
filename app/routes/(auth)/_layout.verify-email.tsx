import { createFileRoute } from '@tanstack/react-router'
import { VerifyEmailForm } from '~/auth/components/verify-email-form'
import { Button } from '~/ui/button'
import type { ComponentProps } from 'react'

export const Route = createFileRoute('/(auth)/_layout/verify-email')({
  component: () => RouteComponent(),
})

const RouteComponent = () => {
  return (
    <>
      <Title>verify email</Title>
      <VerifyEmailForm />
      <GetNewEmailVerificationCode />
    </>
  )
}

//TODO: get new email verification code
const GetNewEmailVerificationCode = () => {
  return (
    <RedirectText>
      something went wrong?
      <Button className="ml-2 h-auto p-0 text-primary" variant="link">
        Get another code
      </Button>
    </RedirectText>
  )
}

const Title = (props: ComponentProps<'h2'>) => {
  return (
    <h2
      className="mb-16 text-center text-2xl font-semibold capitalize"
      {...props}
    />
  )
}

const RedirectText = (props: ComponentProps<'p'>) => {
  return (
    <p
      className="mt-16 text-center text-sm text-accent-foreground"
      {...props}
    />
  )
}
