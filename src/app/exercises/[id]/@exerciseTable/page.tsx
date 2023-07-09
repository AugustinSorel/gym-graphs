import type { ExerciseData } from "@/fakeData";
import { columns } from "./columns";
import { DataTable } from "./dataTable";

//TODO: data sync with graph
const Page = ({ data }: { data: ExerciseData[] }) => {
  return (
    <div className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default Page;
