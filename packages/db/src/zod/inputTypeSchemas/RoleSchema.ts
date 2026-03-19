import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN','TEACHER']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export default RoleSchema;
