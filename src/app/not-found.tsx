import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";
import Link from "next/link";
import type { ComponentProps } from "react";

export const dynamic = "force-static";

const NotFound = () => {
  return (
    <Container>
      <FileWarning className="h-24 w-24 stroke-muted-foreground" />
      <Title>404 error</Title>
      <Text>Sorry page not found</Text>
      <Button asChild size="lg">
        <Link href="/">home</Link>
      </Button>
    </Container>
  );
};

export default NotFound;

const Container = (props: ComponentProps<"main">) => {
  return (
    <main
      {...props}
      className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center space-y-5 text-center"
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 {...props} className="text-6xl font-bold uppercase" />;
};

const Text = (props: ComponentProps<"p">) => {
  return <p {...props} className="text-xl text-muted-foreground" />;
};
