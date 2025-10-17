import { useMutation } from "@tanstack/react-query";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon, GithubIcon } from "~/ui/icons";
import { api, parseJsonResponse } from "~/libs/api";
import type { InferRequestType } from "hono";

const routeApi = getRouteApi("/(auth)/_layout");

export const GithubSignIn = () => {
  const githubSignIn = useGithubSignIn();
  const search = routeApi.useSearch();

  return (
    <>
      <Button
        className="mt-3 w-full bg-black font-semibold hover:bg-black/80"
        onClick={() => {
          githubSignIn.mutate({ callbackUrl: search.callbackUrl ?? "" });
        }}
      >
        <GithubIcon />
        <span>github</span>
        {githubSignIn.isPending && <Spinner />}
      </Button>

      {search.error && (
        <Alert variant="destructive" className="mt-3">
          <AlertCircleIcon />
          <AlertTitle>Github Oauth Failed!</AlertTitle>
          <AlertDescription>{search.error}</AlertDescription>
        </Alert>
      )}
    </>
  );
};

const useGithubSignIn = () => {
  const [isRedirectPending, startRedirectTransition] = useTransition();

  const githubSignIn = useMutation({
    mutationFn: async (
      query: InferRequestType<typeof api.oauth.github.$post>["query"],
    ) => {
      const req = api.oauth.github.$post({ query });

      return parseJsonResponse(req);
    },
    onSuccess: (url) => {
      startRedirectTransition(async () => {
        window.location.href = url;
      });
    },
  });

  return {
    ...githubSignIn,
    isPending: githubSignIn.isPending || isRedirectPending,
  };
};
