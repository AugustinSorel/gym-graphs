import type { PropsWithChildren, ReactNode } from "react";

type Props = {
  newExerciseDataForm: ReactNode;
} & PropsWithChildren;

const Layout = (props: Props) => {
  return (
    <>
      <div className="space-y-5 p-5">{props.newExerciseDataForm}</div>
      {props.children}
    </>
  );
};

export default Layout;
