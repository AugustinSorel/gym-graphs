import {
  CatchBoundary,
  createFileRoute,
  ErrorComponentProps,
  redirect,
} from "@tanstack/react-router";
import { useUser } from "~/domains/user/hooks/use-user";
import { Separator } from "~/ui/separator";
import { Button } from "~/ui/button";
import { Badge } from "~/ui/badge";
import { cn } from "~/styles/styles.utils";
import {
  CheckIcon,
  AlertCircleIcon,
  LaptopIcon,
  MoonIcon,
  SunIcon,
} from "~/ui/icons";
import { ToggleGroup, ToggleGroupItem } from "~/ui/toggle-group";
import { Spinner } from "~/ui/spinner";
import { RenameUserDialog } from "~/domains/user/components/rename-user-dialog";
import { DeleteAccountDialog } from "~/domains/user/components/delete-account-dialog";
// import { DefaultErrorFallback } from "~/components/default-error-fallback";
import { userSchema } from "@gym-graphs/schemas/user";
import { useUpdateWeightUnit } from "~/domains/user/hooks/use-update-weight-unit";
import { useSignOut } from "~/domains/session/hooks/use-sign-out";
// import { CreateTagDialog } from "~/tag/components/create-tag-dialog";
import { useTheme } from "~/theme/theme.context";
import { themeSchema } from "~/theme/theme.schemas";
import { useMutation } from "@tanstack/react-query";
// import {
//   selectUserDataAction,
//   updateOneRepMaxAlgoAction,
// } from "~/user/user.actions";
import { userQueries } from "~/domains/user/user.queries";
import { Alert, AlertDescription, AlertTitle } from "~/ui/alert";
import { OneRepMaxAlgorithmsGraph } from "~/domains/set/components/one-rep-max-algorithms-graph";
// import { dashboardQueries } from "~/dashboard/dashboard.queries";
// import { TagsList } from "~/user/components/tags-list";
import { api, parseJsonResponse } from "~/libs/api";
import type { ComponentProps, PropsWithChildren } from "react";
import type { InferRequestType } from "hono";

export const Route = createFileRoute("/(settings)/settings")({
  component: () => RouteComponent(),
  beforeLoad: async ({ context }) => {
    if (!context.user?.emailVerifiedAt) {
      throw redirect({ to: "/dashboard" });
    }
  },
  // loader: async ({ context }) => {
  // const queries = {
  //   tilesToTagsCount: dashboardQueries.tilesToTagsCount,
  // };

  // await context.queryClient.ensureQueryData(queries.tilesToTagsCount);
  // },
});

const RouteComponent = () => {
  return (
    <Main>
      <Header>
        <Title>account settings</Title>
      </Header>

      <Separator />

      <EmailSection />
      <RenameUserSection />
      {/*<TagsSection />*/}
      <OneRepMaxAlgoSection />
      <ChangeWeightUnitSection />
      <ChangeThemeSection />
      {/*<DownloadUserData />*/}
      <SignOutSection />
      <DeleteAccountSection />
    </Main>
  );
};

const EmailSection = () => {
  const user = useUser();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>email address</SectionTitle>
          <SectionDescription>
            {user.data.email}{" "}
            <Badge className="ml-1" variant="success">
              verified
            </Badge>
          </SectionDescription>
        </HGroup>
      </Section>
    </CatchBoundary>
  );
};

const RenameUserSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>rename yourself</SectionTitle>
          <SectionDescription>
            Feel free to rename yourself to a more confortable name. Your name
            is not public but it will be visible to the members of your teams.
          </SectionDescription>
        </HGroup>
        <Footer>
          <RenameUserDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

// const TagsSection = () => {
//   return (
//     <CatchBoundary
//       errorComponent={DefaultErrorFallback}
//       getResetKey={() => "reset"}
//     >
//       <Section>
//         <HGroup>
//           <SectionTitle>tags</SectionTitle>
//           <SectionDescription>Manage your exercise tags</SectionDescription>

//           <TagsList />
//         </HGroup>
//         <Footer>
//           <CreateTagDialog />
//         </Footer>
//       </Section>
//     </CatchBoundary>
//   );
// };

const useUpdateOneRepMaxAlgo = () => {
  const req = api().users.me.$patch;

  return useMutation({
    mutationFn: async (
      json: Pick<InferRequestType<typeof req>["json"], "oneRepMaxAlgo">,
    ) => {
      const req = api().users.me.$patch({ json });

      return parseJsonResponse(req);
    },
    onMutate: async (variables, ctx) => {
      await ctx.client.cancelQueries(userQueries.get);

      ctx.client.setQueryData(userQueries.get.queryKey, (user) => {
        if (!user || !variables.oneRepMaxAlgo) {
          return user;
        }

        return {
          ...user,
          oneRepMaxAlgo: variables.oneRepMaxAlgo,
        };
      });
    },
    onSettled: (_data, _error, _variables, _res, ctx) => {
      void ctx.client.invalidateQueries(userQueries.get);
    },
  });
};

const OneRepMaxAlgoSection = () => {
  const user = useUser();
  const updateOneRepMaxAlgo = useUpdateOneRepMaxAlgo();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>one rep max algorithm</SectionTitle>
          <SectionDescription>
            Change your one rep max algorithm to something that suits you
            better.
          </SectionDescription>
        </HGroup>

        <ToggleGroup
          className="m-3 mt-0 flex flex-wrap justify-start gap-1 rounded-md border p-1 lg:m-6 lg:gap-4 lg:p-4"
          type="single"
          value={user.data.oneRepMaxAlgo}
          onValueChange={(unsafeOneRepMaxAlgo) => {
            const oneRepMaxAlgo =
              userSchema.shape.oneRepMaxAlgo.safeParse(unsafeOneRepMaxAlgo);

            if (!oneRepMaxAlgo.success) {
              return;
            }

            updateOneRepMaxAlgo.mutate({
              oneRepMaxAlgo: oneRepMaxAlgo.data,
            });
          }}
        >
          {userSchema.shape.oneRepMaxAlgo.options.map((algo) => (
            <ToggleGroupItem
              key={algo}
              className="group hover:bg-transparent data-[state=on]:bg-transparent [&_svg]:size-3"
              value={algo}
            >
              <Badge
                className="group-aria-checked:border-primary/50 group-aria-checked:bg-primary/20 group-aria-checked:text-primary hover:group-aria-checked:bg-primary/30"
                variant="outline"
              >
                <CheckIcon className="mr-1 hidden group-aria-checked:block" />
                {algo}
              </Badge>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>

        {updateOneRepMaxAlgo.error && (
          <SectionErrorAlert>
            {updateOneRepMaxAlgo.error.message}
          </SectionErrorAlert>
        )}

        <div className="m-3 rounded-md border lg:m-6">
          <OneRepMaxAlgorithmsGraph />
        </div>
      </Section>
    </CatchBoundary>
  );
};

const ChangeWeightUnitSection = () => {
  const updateWeightUnit = useUpdateWeightUnit();
  const user = useUser();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>change weight unit</SectionTitle>
          <SectionDescription>
            Tailor your experience by selecting your preferred weight unit.
          </SectionDescription>
        </HGroup>

        {updateWeightUnit.error?.message && (
          <SectionErrorAlert>
            {updateWeightUnit.error.message}
          </SectionErrorAlert>
        )}

        <Footer>
          <ToggleGroup
            type="single"
            value={user.data.weightUnit}
            variant="outline"
            onValueChange={(unsafeWeightUnit) => {
              const weightUnitParsed =
                userSchema.shape.weightUnit.safeParse(unsafeWeightUnit);

              if (!weightUnitParsed.success) {
                return;
              }

              updateWeightUnit.mutate({
                weightUnit: weightUnitParsed.data,
              });
            }}
          >
            {userSchema.shape.weightUnit.options.map((weightUnit) => (
              <ToggleGroupItem
                key={weightUnit}
                value={weightUnit}
                aria-label={`Change weight unit to ${weightUnit}`}
                variant="outline"
              >
                {weightUnit}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const ChangeThemeSection = () => {
  const theme = useTheme();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>change theme</SectionTitle>
          <SectionDescription>
            Make your workspace truly yours with our flexible theme options.
          </SectionDescription>
        </HGroup>
        <Footer>
          <ToggleGroup
            type="single"
            value={theme.value}
            onValueChange={(unsafeTheme) => {
              const themeParsed = themeSchema.safeParse(unsafeTheme);

              if (!themeParsed.success) {
                return;
              }

              theme.set(themeParsed.data);
            }}
          >
            <ToggleGroupItem
              value={themeSchema.enum.system}
              aria-label="Change theme to system"
              variant="outline"
            >
              <LaptopIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              value={themeSchema.enum.light}
              aria-label="Change theme to light"
              variant="outline"
            >
              <SunIcon />
            </ToggleGroupItem>
            <ToggleGroupItem
              value={themeSchema.enum.dark}
              aria-label="Change theme to dark"
              variant="outline"
            >
              <MoonIcon />
            </ToggleGroupItem>
          </ToggleGroup>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

// const DownloadUserData = () => {
//   const downloadUserData = useDownloadUserData();

//   return (
//     <CatchBoundary
//       errorComponent={DefaultErrorFallback}
//       getResetKey={() => "reset"}
//     >
//       <Section>
//         <HGroup>
//           <SectionTitle>download data</SectionTitle>
//           <SectionDescription>
//             feel free to download your data in json format.
//           </SectionDescription>
//         </HGroup>

//         {downloadUserData.error?.message && (
//           <SectionErrorAlert>
//             {downloadUserData.error.message}
//           </SectionErrorAlert>
//         )}

//         <Footer>
//           <Button
//             size="sm"
//             onClick={() => downloadUserData.mutate(undefined)}
//             disabled={downloadUserData.isPending}
//           >
//             <span>download</span>
//             {downloadUserData.isPending && <Spinner />}
//           </Button>
//         </Footer>
//       </Section>
//     </CatchBoundary>
//   );
// };

const SignOutSection = () => {
  const signOut = useSignOut();

  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section>
        <HGroup>
          <SectionTitle>sign out</SectionTitle>
          <SectionDescription>Sign out from this device.</SectionDescription>
        </HGroup>
        <Footer>
          <Button
            size="sm"
            disabled={signOut.isPending}
            data-umami-event="sign-out"
            onClick={() => {
              signOut.mutate(undefined);
            }}
          >
            <span>sign out</span>
            {signOut.isPending && <Spinner />}
          </Button>
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const DeleteAccountSection = () => {
  return (
    <CatchBoundary
      errorComponent={DefaultErrorFallback}
      getResetKey={() => "reset"}
    >
      <Section className="border-destructive">
        <HGroup>
          <SectionTitle>delete account</SectionTitle>
          <SectionDescription>
            Permanently remove your personal account and all of its contents
            from our servers. This action is not reversible, so please continue
            with caution.
          </SectionDescription>
        </HGroup>
        <Footer className="border-destructive bg-destructive/10">
          <DeleteAccountDialog />
        </Footer>
      </Section>
    </CatchBoundary>
  );
};

const Main = (props: ComponentProps<"main">) => {
  return (
    <main
      className="max-w-app mx-auto flex flex-col gap-10 px-2 pt-10 pb-20 sm:px-4 lg:gap-20 lg:pt-20"
      {...props}
    />
  );
};

const Title = (props: ComponentProps<"h1">) => {
  return <h1 className="text-3xl font-semibold capitalize" {...props} />;
};

const SectionTitle = (props: ComponentProps<"h2">) => {
  return <h2 className="text-xl font-semibold capitalize" {...props} />;
};

const SectionDescription = (props: ComponentProps<"p">) => {
  return <p className="text-sm" {...props} />;
};

const Header = (props: ComponentProps<"header">) => {
  return <header className="grid gap-2" {...props} />;
};

const Section = ({ className, ...props }: ComponentProps<"section">) => {
  return (
    <section
      className={cn(
        "bg-secondary overflow-hidden rounded-md border",
        className,
      )}
      {...props}
    />
  );
};

const HGroup = (props: ComponentProps<"hgroup">) => {
  return <hgroup className="space-y-3 p-3 lg:p-6" {...props} />;
};

const Footer = ({ className, ...props }: ComponentProps<"footer">) => {
  return (
    <footer
      className={cn(
        "bg-background flex items-center justify-end border-t px-3 py-4 lg:px-6",
        className,
      )}
      {...props}
    />
  );
};

const SectionErrorAlert = (props: Readonly<PropsWithChildren>) => {
  return (
    <Alert variant="destructive" className="mx-3 mb-3 w-auto lg:mx-6 lg:mb-6">
      <AlertCircleIcon />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>{props.children}</AlertDescription>
    </Alert>
  );
};

// const useDownloadUserData = () => {
//   return useMutation({
//     mutationFn: selectUserDataAction,
//     onSuccess: (userData) => {
//       const blob = new Blob([JSON.stringify(userData, null, 2)]);
//       const url = window.URL.createObjectURL(blob);
//       const a = document.createElement("a");

//       a.href = url;
//       a.download = "user-data.json";

//       document.body.appendChild(a);

//       a.click();

//       document.body.removeChild(a);

//       window.URL.revokeObjectURL(url);
//     },
//   });
// };

export const DefaultErrorFallback = (props: ErrorComponentProps) => {
  return (
    <Container>
      <HGroup>
        <Title>something went wrong</Title>
        <ErrorMsg>{props.error.message}</ErrorMsg>
      </HGroup>
      <Footer className="border-destructive bg-destructive/10 flex items-center justify-end border-t px-6 py-4">
        <Button size="sm" onClick={props.reset} variant="destructive">
          try again
        </Button>
      </Footer>
    </Container>
  );
};

const Container = (props: ComponentProps<"div">) => {
  return (
    <div
      role="alert"
      className="border-destructive bg-destructive/10 rounded-md border"
      {...props}
    />
  );
};

const ErrorMsg = (props: ComponentProps<"code">) => {
  return <code className="flex text-sm" {...props} />;
};
