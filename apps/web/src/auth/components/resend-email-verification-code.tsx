import { Button } from "~/ui/button";
import { useMutation } from "@tanstack/react-query";
import { sendEmailVerificationCodeAction } from "~/auth/auth.actions";
import { Spinner } from "~/ui/spinner";
import { CheckIcon } from "~/ui/icons";
import type { ComponentProps } from "react";

export const ResendEmailVerificationCode = () => {
  const sendEmailVerification = useSendEmailVerificationCode();

  return (
    <RedirectText>
      something went wrong?
      <Button
        className="text-primary ml-2 h-auto p-0 hover:cursor-pointer"
        variant="link"
        disabled={sendEmailVerification.isPending}
        onClick={() => sendEmailVerification.mutate(undefined)}
        data-umami-event="resend email verification code"
      >
        <span>Get another code</span>
        {sendEmailVerification.isPending && <Spinner />}
        {sendEmailVerification.isSuccess && <CheckIcon />}
      </Button>
    </RedirectText>
  );
};

const RedirectText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="text-accent-foreground mt-16 text-center text-sm"
      {...props}
    />
  );
};

const useSendEmailVerificationCode = () => {
  return useMutation({
    mutationFn: sendEmailVerificationCodeAction,
  });
};
