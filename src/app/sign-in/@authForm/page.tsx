import { EmailSignIn, GithubSignIn, GoogleSignIn } from "./authControllers";
import { DashboardBackground } from "@/components/ui/dashboardBackground";

const AuthForm = () => {
  return (
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

        <EmailSignIn />

        <p className="flex flex-row text-sm uppercase text-muted-foreground before:my-auto before:mr-3 before:h-px before:grow before:bg-current after:my-auto after:ml-3 after:h-px after:grow after:bg-current">
          or continue with
        </p>

        <div className="space-y-2">
          <GoogleSignIn />
          <GithubSignIn />
        </div>
      </div>

      <div className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10">
        <DashboardBackground />
      </div>
    </div>
  );
};

export default AuthForm;
