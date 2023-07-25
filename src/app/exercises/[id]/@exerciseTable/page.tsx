import { columns } from "./_table/columns";
import { DataTable } from "./_table/dataTable";

const Page = () => {
  return (
    <div className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <DataTable columns={columns} />
    </div>
  );
};

export default Page;
