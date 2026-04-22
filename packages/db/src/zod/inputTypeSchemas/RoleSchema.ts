import { z } from 'zod';

export const RoleSchema = z.enum(['ADMIN','MANAGER','TEACHER']);

export type RoleType = `${z.infer<typeof RoleSchema>}`

export default RoleSchema;
