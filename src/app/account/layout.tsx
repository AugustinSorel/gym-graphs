import type { PropsWithChildren } from "react";

const Layout = (props: PropsWithChildren) => {
  return (
    <main className="space-y-5">
      <h1 className="col-span-2 border-b border-border px-[max(calc((100vw-50rem)/2),1rem)] py-10 text-3xl font-medium capitalize">
        account settings
      </h1>

      <div className="flex flex-col items-center justify-center sm:px-[max(calc((100vw-50rem)/2),1rem)]">
        {props.children}
      </div>
    </main>
  );
};

export default Layout;
