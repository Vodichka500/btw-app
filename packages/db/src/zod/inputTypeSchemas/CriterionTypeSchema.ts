import { z } from 'zod';

export const CriterionTypeSchema = z.enum(['YES_NO','SCALE','TEXT']);

export type CriterionTypeType = `${z.infer<typeof CriterionTypeSchema>}`

export default CriterionTypeSchema;
