CREATE TYPE "dashboard_view" AS ENUM('graph', 'trending');--> statement-breakpoint
CREATE TYPE "one_rep_max_algo" AS ENUM('adams', 'baechle', 'berger', 'brown', 'brzycki', 'epley', 'kemmler', 'landers', 'lombardi', 'mayhew', 'naclerio', 'oConner', 'wathen');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "oneRepMaxAlgo" "one_rep_max_algo" DEFAULT 'epley'::"one_rep_max_algo" NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "dashboardView" "dashboard_view" DEFAULT 'graph'::"dashboard_view" NOT NULL;