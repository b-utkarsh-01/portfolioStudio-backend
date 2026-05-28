import { z } from "zod";

const safeString = (max = 2000) => z.string().trim().max(max);
const safeUrl = () => safeString(2048);

const contactSchema = z
  .object({
    type: safeString(24),
    text: safeString(200),
    href: safeUrl(),
    external: z.boolean().optional(),
  })
  .passthrough();

const portfolioProfileSchema = z
  .object({
    name: safeString(120).min(1),
    title: z.array(safeString(120)).max(20).optional(),
    summary: safeString(5000).optional(),
    highlights: z.array(safeString(200)).max(50).optional(),
    contacts: z.array(contactSchema).max(30).optional(),
    avatar: safeUrl().optional(),
  })
  .passthrough();

const itemSchema = (shape) => z.object(shape).passthrough();

const portfolioDataSchema = z
  .object({
    layout: z
      .object({
        stages: z
          .array(
            z
              .object({
                id: safeString(80),
                title: safeString(120),
                enabled: z.boolean().optional(),
              })
              .passthrough()
          )
          .max(100)
          .optional(),
      })
      .passthrough()
      .optional(),
    customStages: z.array(z.any()).max(200).optional(),
    profile: portfolioProfileSchema,
    badgeName: z
      .object({
        name: safeString(120).optional(),
        logo: safeString(12).optional(),
        badgeTitle: safeString(200).optional(),
      })
      .passthrough()
      .optional(),
    skills: z.record(z.array(safeString(80)).max(200)).optional(),
    education: z.array(z.any()).max(200).optional(),
    experiences: z
      .array(itemSchema({ title: safeString(200).optional(), company: safeString(200).optional() }))
      .max(200)
      .optional(),
    projects: z
      .array(
        itemSchema({
          name: safeString(200).optional(),
          tech: safeString(400).optional(),
          description: safeString(2000).optional(),
          link: safeUrl().optional(),
          image: safeUrl().optional(),
        })
      )
      .max(200)
      .optional(),
  })
  .passthrough();

export const portfolioUpsertSchema = z.object({
  templateId: safeString(60).optional(),
  data: portfolioDataSchema,
});

