import { createFileRoute, Link } from "@tanstack/react-router";
import { ComponentProps } from "react";
import { Button } from "~/components/ui/button";
import { EmailSignUp } from "~/features/auth/components/email-sign-up";

export const Route = createFileRoute("/(auth)/_auth/sign-up")({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <>
      <Title>welcome</Title>

      <EmailSignUp />

      <RedirectText>
        already have an account?{" "}
        <Button
          variant="link"
          asChild
          className="h-auto w-auto p-0 text-primary"
        >
          <Link to="/sign-in">sign in</Link>
        </Button>
      </RedirectText>
    </>
  );
}

const Title = (props: ComponentProps<"h2">) => {
  return (
    <h2
      className="mb-16 text-center text-2xl font-semibold capitalize"
      {...props}
    />
  );
};

const RedirectText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="mt-16 text-center text-sm text-accent-foreground"
      {...props}
    />
  );
};
