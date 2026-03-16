import { Effect } from "effect";
import { VerificationCodeRepo } from "./repo";

export class VerificationCodeService extends Effect.Service<VerificationCodeService>()(
  "VerificationCodeService",
  {
    dependencies: [VerificationCodeRepo.Default],
    accessors: true,
    effect: Effect.gen(function* () {
      yield* VerificationCodeRepo;

      return {};
    }),
  },
) {}
