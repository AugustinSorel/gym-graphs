import type { PropsWithChildren, ReactNode } from "react";

type Props = {
  hero: ReactNode;
  authForm: ReactNode;
} & PropsWithChildren;

const SignInLayout = (props: Props) => {
  return (
    <main className="flex min-h-[calc(100dvh-var(--header-height))]">
      {props.hero}
      {props.authForm}
      {props.children}
    </main>
  );
};

export default SignInLayout;
