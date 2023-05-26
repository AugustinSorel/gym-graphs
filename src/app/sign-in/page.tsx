import { GithubSignIn, GoogleSignIn } from "./authButtons";
import { Button } from "@/components/ui/button";
import { DashboardBackground } from "@/components/ui/dashboardBackground";
import { HeroBackground } from "@/components/ui/heroBackground";
import { Icon } from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import type { PropsWithChildren } from "react";

//TODO: add shadcn form component
//TODO: facade pattern
const LoginPage = async () => {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-[calc(100vh-var(--header-height))]">
      <div className="relative hidden grow items-center justify-center gap-5 overflow-x-clip lg:flex">
        <Icon size="lg" />
        <h1 className="text-4xl font-bold capitalize">gym graphs</h1>

        <BackgroundLayout>
          <HeroBackground />
        </BackgroundLayout>
      </div>

      <div className="relative flex grow">
        <div className="m-auto flex min-w-[min(500px,60%)] flex-col gap-10">
          <div className="space-y-2">
            <h2 className="text-center text-3xl font-bold capitalize">
              create an account
            </h2>
            <p className="text-center text-muted-foreground first-letter:capitalize">
              enter your email below to create an account
            </p>
          </div>

          <form className="space-y-2">
            <Input type="text" placeholder="name@example.com" />
            <Button className=" w-full font-medium lowercase">
              sign in with email
            </Button>
          </form>

          <p className="flex flex-row text-sm uppercase text-muted-foreground before:my-auto before:mr-3 before:h-px before:grow before:bg-current after:my-auto after:ml-3 after:h-px after:grow after:bg-current">
            or continue with
          </p>

          <div className="space-y-2">
            <GoogleSignIn />
            <GithubSignIn />
          </div>
        </div>

        <BackgroundLayout>
          <DashboardBackground />
        </BackgroundLayout>
      </div>
    </main>
  );
};

export default LoginPage;

const BackgroundLayout = ({ children }: PropsWithChildren) => {
  return (
    <div className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10">
      {children}
    </div>
  );
};
