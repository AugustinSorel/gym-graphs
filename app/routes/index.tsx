import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => Home(),
});

const Home = () => {
  return <p>i....</p>;
};
