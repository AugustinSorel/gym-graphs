import { HeroBackground } from "@/components/ui/heroBackground";
import { Icon } from "@/components/ui/icon";

//FIXME: main could be position absolute
const LoginPage = () => {
  return (
    <main className="flex min-h-[calc(100vh-var(--header-height))]">
      <div className="relative flex grow items-center justify-center gap-5 overflow-x-clip">
        <Icon size="lg" />
        <h1 className="text-4xl font-bold capitalize">gym tracker</h1>

        <div className="absolute -top-[var(--header-height)] bottom-0 left-0 -z-10 min-w-[100vw]">
          <HeroBackground />
        </div>
      </div>

      <div className="flex grow">
        <h2>create an account</h2>
        <p>enter your email below to create an account</p>
      </div>
    </main>
  );
};

export default LoginPage;
