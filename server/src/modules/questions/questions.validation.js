// questions validation — Zod schemas. Mutating bodies are `.strict()` (reject unknown
// fields → mass-assignment hardening: legacy spread `...req.body` straight into the
// services). Numeric path params / query are coerced. Failures auto-return 422 + details.
import { z } from "zod";

const idParam = z.coerce.number().int().positive();

export class QuestionsValidation {
  // params
  static clientLeadIdParam = z.object({ clientLeadId: idParam });
  static sessionQuestionIdParam = z.object({ sessionQuestionId: idParam });
  static leadCustomParam = z.object({ clientLeadId: idParam });
  static versaCategoryParam = z.object({ clientLeadId: idParam, categoryId: idParam });
  static versaStepParam = z.object({ stepId: idParam });

  // query
  static sessionQuestionsQuery = z.object({
    questionTypeId: z.coerce.number().int().positive(),
  });

  // bodies (strict whitelist of the fields the legacy services actually consume)
  static answerBody = z
    .object({ response: z.string().min(1) })
    .strict();

  static bulkAnswerBody = z
    .object({
      answers: z
        .array(
          z
            .object({
              sessionQuestionId: z.coerce.number().int().positive(),
              response: z.string().min(1),
            })
            .strict(),
        )
        .min(1),
    })
    .strict();

  static customQuestionBody = z
    .object({
      questionTypeId: z.coerce.number().int().positive(),
      title: z.string().min(1),
      // legacy accepted an `isCustom` flag in the body but the service ALWAYS forces
      // isCustom:true; we accept-and-ignore it so existing clients don't 422, but it is
      // never used (the repo hard-codes isCustom:true).
      isCustom: z.boolean().optional(),
    })
    .strict();

  static createVersaBody = z
    .object({
      // categoryId comes authoritatively from the path; accept an optional body copy
      // (legacy spread the body) but it is ignored by the usecase.
      categoryId: z.coerce.number().int().positive().optional(),
    })
    .strict();

  static updateVersaStepBody = z
    .object({
      label: z.string().nullish(),
      question: z.string().nullish(),
      answer: z.string().nullish(),
      clientResponse: z.string().nullish(),
    })
    .strict();
}
