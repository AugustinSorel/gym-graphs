import { getServerAuthSession } from "@/server/auth";
import { redirect } from "next/navigation";
import { type ComponentPropsWithoutRef } from "react";
import Hero from "./_hero/hero";
import AuthForm from "./_authForm/authForm";

const Page = async () => {
  const session = await getServerAuthSession();

  if (session?.user.id) {
    return redirect("/dashboard");
  }

  return (
    <Container className="flex min-h-[calc(100dvh-var(--header-height))]">
      <Hero />
      <AuthForm />
    </Container>
  );
};

export default Page;

const Container = (props: ComponentPropsWithoutRef<"main">) => {
  return <main {...props} />;
};
