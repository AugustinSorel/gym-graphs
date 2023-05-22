import { Button } from "@/components/ui/button";
import { HeroBackground } from "@/components/ui/heroBackground";
import { Icon } from "@/components/ui/icon";

//FIXME: main could be position absolute
const LoginPage = () => {
  return (
    <main className="flex min-h-[calc(100vh-var(--header-height))]">
      <div className="relative hidden grow items-center justify-center gap-5 overflow-x-clip lg:flex">
        <Icon size="lg" />
        <h1 className="text-4xl font-bold capitalize">gym graphs</h1>

        <div className="absolute -top-[var(--header-height)] bottom-0 left-0 -z-10 min-w-[100vw]">
          <HeroBackground />
        </div>
      </div>

      <div className="flex grow">
        <div className="m-auto flex flex-col">
          <h2 className="text-4xl font-bold capitalize">create an account</h2>
          <p className="text-primary-foreground first-letter:capitalize">
            enter your email below to create an account
          </p>
          <input type="text" />
          <Button className="font-bold lowercase" size="lg">
            sign in with email
          </Button>
          <p className="flex flex-row text-xs uppercase text-primary-foreground before:my-auto before:mr-3 before:h-px before:grow before:bg-current after:my-auto after:ml-3 after:h-px after:grow after:bg-current ">
            or continue with
          </p>
          <Button className="border-none bg-white text-sm font-bold uppercase text-black hover:bg-white">
            google
          </Button>
          <Button className="border-none bg-black text-sm font-bold uppercase text-white hover:bg-black">
            github
          </Button>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
