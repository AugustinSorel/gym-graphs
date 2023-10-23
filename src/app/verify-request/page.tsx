import { DashboardBackground } from "@/components/ui/dashboardBackground";
import type { ComponentProps } from "react";
import { MailPlus } from "lucide-react";
import { redirectIfSignedIn } from "@/lib/auth";

const Page = async () => {
  await redirectIfSignedIn();

  return (
    <Container>
      <ContentContainer>
        <MailPlus className="h-24 w-24 stroke-muted-foreground" />
        <Title>verify your account</Title>
        <Text>
          Check the email that&apos;s associated with your account to start
          using our services
        </Text>
      </ContentContainer>

      <BackgroundContainer>
        <DashboardBackground />
      </BackgroundContainer>
    </Container>
  );
};

export default Page;

const BackgroundContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="absolute -top-[var(--header-height)] bottom-0 left-0 right-0 -z-10"
    />
  );
};

const ContentContainer = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="-mt-14 flex min-w-[min(500px,60%)] flex-col items-center gap-10 p-5"
    />
  );
};

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      {...props}
      className="relative flex flex-1 items-center justify-center"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-center text-4xl font-bold uppercase" />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="text-center text-xl text-muted-foreground" />;
};
