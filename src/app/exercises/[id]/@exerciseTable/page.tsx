import { ExerciseData, columns } from "./columns";
import { DataTable } from "./dataTable";

async function getData(): Promise<ExerciseData[]> {
  return [
    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2020"),
    },
  ];
}

export default async function Page() {
  const data = await getData();

  return (
    <div className="rounded-md border border-border bg-primary backdrop-blur-md">
      <DataTable columns={columns} data={data} />
    </div>
  );
}
