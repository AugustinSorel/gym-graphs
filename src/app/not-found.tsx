import { Button } from "@/components/ui/button";
import { FileWarning } from "lucide-react";
import Link from "next/link";

const NotFound = () => {
  return (
    <main className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center space-y-5 text-center">
      <FileWarning className="h-24 w-24 stroke-muted-foreground" />
      <h1 className="text-6xl font-bold uppercase">404 error</h1>
      <p className="text-xl text-muted-foreground">Sorry page not found</p>
      <Button asChild size="lg">
        <Link href="/">home</Link>
      </Button>
    </main>
  );
};

export default NotFound;
