import { useMutation } from "@tanstack/react-query";
import { Button } from "~/ui/button";
import { Spinner } from "~/ui/spinner";
import { useTransition } from "react";
import { getRouteApi } from "@tanstack/react-router";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { AlertCircleIcon, GithubIcon } from "~/ui/icons";
import { callApi, InferApiProps } from "~/libs/api";

const routeApi = getRouteApi("/(auth)");

export const GithubSignIn = () => {
  const githubSignIn = useGithubSignIn();
  const search = routeApi.useSearch();

  return (
    <>
      <Button
        className="mt-3 w-full bg-black font-semibold hover:bg-black/80"
        onClick={() => {
          githubSignIn.mutate({
            urlParams: {
              callbackUrl: search.callbackUrl ?? "",
            },
          });
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
    mutationFn: async (props: InferApiProps<"OAuth", "githubSignIn">) => {
      return callApi((api) => {
        return api.OAuth.githubSignIn(props);
      });
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
