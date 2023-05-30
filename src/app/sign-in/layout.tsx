import type { ReactNode } from "react";

type Props = {
  hero: ReactNode;
  authForm: ReactNode;
};

const SignInLayout = (props: Props) => {
  return (
    <main className="flex min-h-[calc(100vh-var(--header-height))]">
      {props.hero}
      {props.authForm}
    </main>
  );
};

export default SignInLayout;
