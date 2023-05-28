import { NewExerciseNameForm } from "./newExerciseNameForm";
import { newExerciseNameSchema } from "@/schemas/exerciseSchemas";

const DashboardPage = async () => {
  const action = async (formData: FormData) => {
    "use server";
    const data = newExerciseNameSchema.safeParse({
      name: formData.get("newExerciseName"),
    });

    if (!data.success) {
      throw new Error(data.error.issues[0]?.message);
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
    //TODO: inset data in db
    console.log(`data: ${data.data.name}`);
  };

  return (
    <div className="space-y-5 p-5">
      <NewExerciseNameForm action={action} />

      <ul className="mx-auto grid max-w-[calc(var(--exercise-card-height)*4+20px*3)] grid-cols-[repeat(auto-fill,minmax(var(--exercise-card-height),1fr))] gap-5">
        {[...Array<unknown>(10)].map((_, i) => (
          <li
            key={i}
            className="h-exercise-card rounded-md border border-border bg-primary p-1 backdrop-blur-md"
          >
            super
          </li>
        ))}
      </ul>
    </div>
  );
};

export default DashboardPage;
