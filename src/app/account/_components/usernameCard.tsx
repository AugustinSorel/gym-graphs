"use client";

import { ErrorBoundary } from "react-error-boundary";
import { Card } from "./card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/loader";
import { userSchema } from "@/schemas/user.schema";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { api } from "@/trpc/react";
import { QueryErrorResetBoundary } from "@tanstack/react-query";
import { Suspense } from "react";
import { useUser } from "./useUser";

export const UsernameCard = () => {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary FallbackComponent={Card.ErrorFallback} onReset={reset}>
          <Suspense fallback={<Card.SkeletonFallback />}>
            <Content />
          </Suspense>
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
};

const Content = () => {
  const formSchema = userSchema.pick({ name: true });
  const [user] = useUser();
  const utils = api.useUtils();

  const renameUser = api.user.rename.useMutation({
    onMutate: async (variables) => {
      await utils.user.get.cancel();

      utils.user.get.setData(undefined, (user) => {
        if (!user) {
          return undefined;
        }

        return { ...user, name: variables.name };
      });
    },
    onSettled: () => {
      void utils.user.get.invalidate();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user.name,
    },
  });

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    renameUser.mutate({ name: values.name });
  };

  return (
    <Card.Root>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card.Body className="relative">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-lg font-semibold capitalize">
                    Username
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder="john"
                      className="w-max"
                      type="tet"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </Card.Body>
          <Card.Footer>
            <Button className="space-x-2" disabled={renameUser.isPending}>
              {renameUser.isPending && <Loader />}
              <span className="capitalize">rename</span>
            </Button>
          </Card.Footer>
        </form>
      </Form>
    </Card.Root>
  );
};
