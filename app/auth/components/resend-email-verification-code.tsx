import { Button } from "~/ui/button";
import { useMutation } from "@tanstack/react-query";
import { sendEmailVerificationCodeAction } from "~/auth/auth.actions";
import { Spinner } from "~/ui/spinner";
import { Check } from "lucide-react";
import type { ComponentProps } from "react";

export const ResendEmailVerificationCode = () => {
  const sendEmailVerification = useSendEmailVerificationCode();

  return (
    <RedirectText>
      something went wrong?
      <Button
        className="ml-2 h-auto p-0 text-primary hover:cursor-pointer"
        variant="link"
        disabled={sendEmailVerification.isPending}
        onClick={() => sendEmailVerification.mutate(undefined)}
        data-umami-event="resend email verification code"
      >
        <span>Get another code</span>
        {sendEmailVerification.isPending && <Spinner />}
        {sendEmailVerification.isSuccess && <Check />}
      </Button>
    </RedirectText>
  );
};

const RedirectText = (props: ComponentProps<"p">) => {
  return (
    <p
      className="mt-16 text-center text-sm text-accent-foreground"
      {...props}
    />
  );
};

const useSendEmailVerificationCode = () => {
  return useMutation({
    mutationFn: sendEmailVerificationCodeAction,
  });
};
