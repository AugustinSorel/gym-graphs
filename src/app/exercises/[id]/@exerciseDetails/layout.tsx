import type { ComponentPropsWithoutRef, PropsWithChildren } from "react";

const Layout = ({ children }: PropsWithChildren) => {
  return <ContentContainer>{children}</ContentContainer>;
};

export default Layout;

const ContentContainer = (props: ComponentPropsWithoutRef<"div">) => {
  return (
    <div
      {...props}
      className="mx-auto flex max-w-[calc(var(--exercise-card-height)*4+20px*3)] flex-col gap-10  pb-5 pt-0 sm:px-5"
    />
  );
};
