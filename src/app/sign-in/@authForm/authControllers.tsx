"use client";

import { Input } from "@/components/ui/input";
import { signIn } from "next-auth/react";
import { useState } from "react";
import type { FormEvent } from "react";
import { ToastAction } from "@/components/ui/toast";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Loader } from "@/components/ui/loader";
import { z } from "zod";

export const GoogleSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clickHandler = async () => {
    try {
      setIsLoading(() => true);
      await signIn("google", { callbackUrl: "/dashboard" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We could not sign you in with your Google account",
        action: (
          <ToastAction altText="Try again" onClick={() => void clickHandler()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsLoading(() => false);
    }
  };

  return (
    <Button
      className="flex w-full items-center gap-2 border-border bg-white text-sm font-bold uppercase text-black hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-neutral-300 dark:focus-visible:ring-red-500"
      onClick={() => void clickHandler()}
      disabled={isLoading}
    >
      {isLoading && <Loader />}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 186.69 190.5"
        className="h-4 w-4"
      >
        <g transform="translate(1184.583 765.171)">
          <path
            d="M-1089.333-687.239v36.888h51.262c-2.251 11.863-9.006 21.908-19.137 28.662l30.913 23.986c18.011-16.625 28.402-41.044 28.402-70.052 0-6.754-.606-13.249-1.732-19.483z"
            fill="#4285f4"
          />
          <path
            d="M-1142.714-651.791l-6.972 5.337-24.679 19.223h0c15.673 31.086 47.796 52.561 85.03 52.561 25.717 0 47.278-8.486 63.038-23.033l-30.913-23.986c-8.486 5.715-19.31 9.179-32.125 9.179-24.765 0-45.806-16.712-53.34-39.226z"
            fill="#34a853"
          />
          <path
            d="M-1174.365-712.61c-6.494 12.815-10.217 27.276-10.217 42.689s3.723 29.874 10.217 42.689c0 .086 31.693-24.592 31.693-24.592-1.905-5.715-3.031-11.776-3.031-18.098s1.126-12.383 3.031-18.098z"
            fill="#fbbc05"
          />
          <path
            d="M-1089.333-727.244c14.028 0 26.497 4.849 36.455 14.201l27.276-27.276c-16.539-15.413-38.013-24.852-63.731-24.852-37.234 0-69.359 21.388-85.032 52.561l31.692 24.592c7.533-22.514 28.575-39.226 53.34-39.226z"
            fill="#ea4335"
          />
        </g>
      </svg>
      <span>google</span>
    </Button>
  );
};

export const GithubSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const clickHandler = async () => {
    try {
      setIsLoading(() => true);
      await signIn("github", { callbackUrl: "/dashboard" });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: "We could not sign you in with your Github account",
        action: (
          <ToastAction altText="Try again" onClick={() => void clickHandler()}>
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsLoading(() => false);
    }
  };

  return (
    <Button
      onClick={() => void clickHandler()}
      className="flex w-full items-center gap-2 border-border bg-black text-sm font-bold uppercase text-white hover:bg-neutral-700 focus-visible:ring-red-500 disabled:opacity-50 dark:hover:bg-neutral-900 dark:focus-visible:ring-ring"
      disabled={isLoading}
    >
      {isLoading && <Loader />}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-4 w-4"
        viewBox="0 0 1024 1024"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M8 0C3.58 0 0 3.58 0 8C0 11.54 2.29 14.53 5.47 15.59C5.87 15.66 6.02 15.42 6.02 15.21C6.02 15.02 6.01 14.39 6.01 13.72C4 14.09 3.48 13.23 3.32 12.78C3.23 12.55 2.84 11.84 2.5 11.65C2.22 11.5 1.82 11.13 2.49 11.12C3.12 11.11 3.57 11.7 3.72 11.94C4.44 13.15 5.59 12.81 6.05 12.6C6.12 12.08 6.33 11.73 6.56 11.53C4.78 11.33 2.92 10.64 2.92 7.58C2.92 6.71 3.23 5.99 3.74 5.43C3.66 5.23 3.38 4.41 3.82 3.31C3.82 3.31 4.49 3.1 6.02 4.13C6.66 3.95 7.34 3.86 8.02 3.86C8.7 3.86 9.38 3.95 10.02 4.13C11.55 3.09 12.22 3.31 12.22 3.31C12.66 4.41 12.38 5.23 12.3 5.43C12.81 5.99 13.12 6.7 13.12 7.58C13.12 10.65 11.25 11.33 9.47 11.53C9.76 11.78 10.01 12.26 10.01 13.01C10.01 14.08 10 14.94 10 15.21C10 15.42 10.15 15.67 10.55 15.59C13.71 14.53 16 11.53 16 8C16 3.58 12.42 0 8 0Z"
          transform="scale(64)"
          fill="#fff"
        />
      </svg>
      github
    </Button>
  );
};

export const EmailSignIn = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const schema = z.object({
    email: z
      .string({ required_error: "email is required" })
      .email({ message: "email must be valid" })
      .min(1, { message: "email must be at leat one charater" })
      .max(255, { message: "email must be at most 255 charaters" }),
  });

  const emailSignInHandler = async () => {
    try {
      setIsLoading(() => true);

      await signIn("email", { callbackUrl: "/dashboard", email });
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Something went wrong",
        description: `We could not sign you in with ${email}`,
        action: (
          <ToastAction
            altText="Try again"
            onClick={() => void emailSignInHandler()}
          >
            Try again
          </ToastAction>
        ),
      });
    } finally {
      setIsLoading(() => false);
    }
  };

  const submitHandler = (e: FormEvent) => {
    e.preventDefault();

    const data = schema.safeParse({ email });

    if (!data.success) {
      return toast({
        variant: "destructive",
        title: "Something went wrong",
        description: data.error.issues[0]?.message ?? "try again",
        action: (
          <ToastAction altText="Try again" onClick={submitHandler}>
            Try again
          </ToastAction>
        ),
      });
    }

    void emailSignInHandler();
  };

  return (
    <form className="space-y-2" onSubmit={submitHandler}>
      <Input
        type="text"
        placeholder="name@example.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <Button
        disabled={isLoading}
        className="w-full space-x-2 font-medium lowercase"
      >
        {isLoading && <Loader />}
        <span>sign in with email</span>
      </Button>
    </form>
  );
};
