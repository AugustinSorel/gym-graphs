import { columns } from "./columns";
import { DataTable } from "./dataTable";

const Page = () => {
  return (
    <div className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <DataTable columns={columns} />
    </div>
  );
};

export default Page;
