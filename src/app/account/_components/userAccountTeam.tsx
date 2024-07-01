"use client";

import { signOut } from "next-auth/react";
import { Card } from "./card";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { Loader } from "@/components/ui/loader";

export const UserAccountCard = () => {
  const signOutMutation = useMutation({
    mutationFn: async () => {
      return signOut({ callbackUrl: "/" });
    },
  });

  return (
    <Card.Root>
      <Card.Body className="relative">
        <Card.Title>account</Card.Title>
        <Card.Description>
          Email: <strong>sorelaugstin@gmail.com</strong>
        </Card.Description>
      </Card.Body>
      <Card.Footer>
        <Button
          className="space-x-2"
          disabled={signOutMutation.isPending}
          onClick={() => {
            signOutMutation.mutate();
          }}
        >
          {signOutMutation.isPending && <Loader />}
          <span className="capitalize">sign out</span>
        </Button>
      </Card.Footer>
    </Card.Root>
  );
};
