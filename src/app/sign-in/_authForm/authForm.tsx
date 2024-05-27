import type { ComponentProps } from "react";
import { EmailSignIn, GithubSignIn, GoogleSignIn } from "./authControllers";
import { DashboardBackground } from "@/components/ui/dashboardBackground";

const AuthForm = () => {
  return (
    <Container>
      <AuthContainer>
        <AuthTextsContainer>
          <Title>create an account</Title>
          <Paragraph>enter your email below to create an account</Paragraph>
        </AuthTextsContainer>

        <EmailSignIn />

        <SeparatorText>or continue with</SeparatorText>

        <AuthControllersContainer>
          <GoogleSignIn />
          <GithubSignIn />
        </AuthControllersContainer>
      </AuthContainer>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default AuthForm;

const Title = (props: ComponentProps<"h2">) => {
  return (
    <h2 {...props} className="text-center text-3xl font-bold capitalize" />
  );
};

const Paragraph = (props: ComponentProps<"p">) => {
  return (
    <p
      {...props}
      className="text-center text-muted-foreground first-letter:capitalize"
    />
  );
};

const SeparatorText = (props: ComponentProps<"p">) => {
  return (
    <p
      {...props}
      className="flex flex-row text-sm uppercase text-muted-foreground before:my-auto before:mr-3 before:h-px before:grow before:bg-current after:my-auto after:ml-3 after:h-px after:grow after:bg-current"
    />
  );
};

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10"
    />
  );
};

const AuthContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="m-auto flex min-w-[min(500px,60%)] flex-col gap-10"
    />
  );
};

const Container = (props: ComponentProps<"div">) => {
  return <div {...props} className="relative flex flex-1" />;
};

const AuthControllersContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="space-y-2" />;
};

const AuthTextsContainer = (props: ComponentProps<"div">) => {
  return <div {...props} className="space-y-2" />;
};
