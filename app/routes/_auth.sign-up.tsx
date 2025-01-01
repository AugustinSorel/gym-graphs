import {
  createFileRoute,
  ErrorComponentProps,
  Link,
  redirect,
} from "@tanstack/react-router";
import { CircleAlert } from "lucide-react";
import { ComponentProps } from "react";
import { Alert, AlertDescription, AlertTitle } from "~/features/ui/alert";
import { Button } from "~/features/ui/button";
import { EmailSignUp } from "~/features/auth/components/email-sign-up";

export const Route = createFileRoute("/_auth/sign-up")({
  beforeLoad: ({ context }) => {
    if (context.user && context.session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: () => RouteComponent(),
  errorComponent: (props) => ErrorComponent(props),
});

const RouteComponent = () => {
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
};

const ErrorComponent = ({ error }: ErrorComponentProps) => {
  return (
    <Alert variant="destructive" className="bg-destructive/5">
      <CircleAlert className="size-4" />
      <AlertTitle>Something went wrong</AlertTitle>
      <AlertDescription>{error.message}</AlertDescription>
    </Alert>
  );
};

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
