import { redirectIfSignedIn } from "@/lib/auth";

const Page = async () => {
  await redirectIfSignedIn();

  return null;
};

export default Page;
