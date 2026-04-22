import { z } from 'zod';

export const MessageStatusSchema = z.enum(['SUCCESS','FAILED']);

export type MessageStatusType = `${z.infer<typeof MessageStatusSchema>}`

export default MessageStatusSchema;
