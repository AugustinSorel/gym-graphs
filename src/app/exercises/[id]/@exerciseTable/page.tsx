import { columns } from "./columns";
import { DataTable } from "./dataTable";

const getData = () => {
  return [
    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2020"),
    },
    {
      numberOfReps: 29,
      weightLifted: 40,
      estimatedPR: 100,
      date: new Date("29/01/2020"),
    },
    {
      numberOfReps: 20,
      weightLifted: 20,
      estimatedPR: 20,
      date: new Date("20/01/2020"),
    },
    {
      numberOfReps: 15,
      weightLifted: 15,
      estimatedPR: 15,
      date: new Date("15/01/2020"),
    },
    {
      numberOfReps: 12,
      weightLifted: 12,
      estimatedPR: 12,
      date: new Date("12/01/2020"),
    },
    {
      numberOfReps: 38,
      weightLifted: 38,
      estimatedPR: 38,
      date: new Date("10/08/2020"),
    },
    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2021"),
    },
    {
      numberOfReps: 29,
      weightLifted: 20,
      estimatedPR: 10,
      date: new Date("10/05/2021"),
    },

    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2021"),
    },

    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2021"),
    },

    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2021"),
    },

    {
      numberOfReps: 10,
      weightLifted: 10,
      estimatedPR: 10,
      date: new Date("10/10/2021"),
    },
  ];
};

const Page = () => {
  const data = getData();

  return (
    <div className="overflow-hidden border-y border-border bg-primary backdrop-blur-md sm:rounded-md sm:border">
      <DataTable columns={columns} data={data} />
    </div>
  );
};

export default Page;
