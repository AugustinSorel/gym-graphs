"use client";

import type { MouseEvent, PropsWithChildren } from "react";
import { Slot } from "@radix-ui/react-slot";
import { twMerge } from "tailwind-merge";
import { ArrowRight, Brush, Github, LineChart, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const Featues = () => {
  return (
    <SectionContainer>
      <SectionTitle>What we offer</SectionTitle>

      <CardsContainer>
        <Card>
          <CardIcon>
            <LineChart className="bg-pink-500/20 stroke-pink-500" />
          </CardIcon>
          <CardTitle>graphs</CardTitle>
          <CardText>
            Keep track of your progress every session and watch your results
            soar! Get ready to see amazing results!
          </CardText>
        </Card>
        <Card>
          <CardIcon>
            <Wallet className="bg-blue-500/20 stroke-blue-500" />
          </CardIcon>
          <CardTitle>100% free</CardTitle>
          <CardText>
            Great news! Our project is completely free to use, with no hidden
            fees or charges. We value your privacy and do not collect any
            personal information.
          </CardText>
        </Card>
        <Card>
          <CardIcon>
            <Github className="bg-green-500/20 stroke-green-500" />
          </CardIcon>
          <CardTitle>open source</CardTitle>
          <CardText>
            Curious about how this was built? You can check out the code on our
            Github page! We welcome feedback and contributions from our
            community,
          </CardText>
        </Card>
        <Card>
          <CardIcon>
            <Brush className="bg-yellow-500/20 stroke-yellow-500" />
          </CardIcon>
          <CardTitle>customizable</CardTitle>
          <CardText>
            With our modular dashboards, you&apos;re in charge of your
            exercises! Customize your workout experience to fit your preferences
            and needs.
          </CardText>
        </Card>
      </CardsContainer>

      <GetStartedAction />
    </SectionContainer>
  );
};

const SectionContainer = (props: PropsWithChildren) => {
  return (
    <section
      className="flex flex-col items-center justify-center gap-10 overflow-hidden p-5 pb-12 text-center"
      {...props}
    />
  );
};

const SectionTitle = (props: PropsWithChildren) => {
  return <h2 className=" text-4xl sm:text-5xl" {...props} />;
};

const CardsContainer = (props: PropsWithChildren) => {
  const mouseMove = (e: MouseEvent) => {
    const parent = Array.from(e.currentTarget.children) as HTMLLIElement[];

    for (const child of parent) {
      const rect = child.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      child.style.setProperty("--mouse-x", `${x}px`);
      child.style.setProperty("--mouse-y", `${y}px`);
    }
  };

  return (
    <ul
      className="group grid w-full max-w-3xl grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-5"
      onMouseMove={mouseMove}
      {...props}
    />
  );
};

const CardIcon = (props: { children: JSX.Element }) => {
  const className = (props.children.props as { className: string }).className;

  return (
    <Slot
      className={twMerge(
        "h-16 w-16 rounded-md stroke-1 p-2 opacity-50",
        className
      )}
      {...props}
    />
  );
};

const CardText = ({ children }: PropsWithChildren) => {
  return <p className="text-muted-foreground">{children}</p>;
};

const CardTitle = ({ children }: PropsWithChildren) => {
  return <h2 className="text-2xl font-semibold capitalize">{children}</h2>;
};

const Card = ({ children }: PropsWithChildren) => {
  return (
    <li className="relative z-[2] overflow-hidden rounded-md bg-foreground/25 before:absolute before:left-0 before:top-0 before:z-[3] before:h-full before:w-full before:opacity-0 before:transition-opacity before:duration-500 before:[background:radial-gradient(800px_circle_at_var(--mouse-x)_var(--mouse-y),_hsl(var(--border)),_transparent_40%)] after:absolute after:left-0 after:top-0 after:-z-[1] after:h-full after:w-full after:opacity-0 after:transition-opacity after:duration-500 after:[background:radial-gradient(400px_circle_at_var(--mouse-x)_var(--mouse-y),_hsl(var(--foreground)/0.5),_transparent_40%)] hover:before:opacity-100 group-hover:after:opacity-100">
      <div className=" m-px flex h-[calc(100%-2px)] w-[calc(100%-2px)] flex-col items-center gap-2.5 rounded-md bg-background p-10">
        {children}
      </div>
    </li>
  );
};

const GetStartedAction = () => {
  return (
    <Button asChild size="lg">
      <Link href="/dashboard">
        <span className="sm:text-xl">get started</span>
        <ArrowRight className="ml-2" />
      </Link>
    </Button>
  );
};
