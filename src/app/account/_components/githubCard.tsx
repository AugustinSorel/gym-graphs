import { Button } from "@/components/ui/button";
import { Card } from "./card";
import Link from "next/link";
import { Github } from "lucide-react";

export const GithubCard = () => {
  return (
    <Card.Root>
      <Card.Body>
        <Card.Title>github</Card.Title>
        <Card.Description>
          If you&apos;re interested in the behind-the-scenes development of our
          platform, we invite you to explore the code on our Github! We highly
          value feedback and contributions from our community.
        </Card.Description>
      </Card.Body>
      <Card.Footer>
        <Button asChild>
          <Link
            href="https://github.com/augustinsorel/gym-graphs"
            target="_blank"
            className="space-x-1"
          >
            <Github className="h-4 w-4" />
            <span className="capitalize">view</span>
          </Link>
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};
