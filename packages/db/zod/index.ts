import { z } from 'zod';
import type { Prisma } from '@prisma/client';

/////////////////////////////////////////
// HELPER FUNCTIONS
/////////////////////////////////////////


/////////////////////////////////////////
// ENUMS
/////////////////////////////////////////

export const TransactionIsolationLevelSchema = z.enum(['ReadUncommitted','ReadCommitted','RepeatableRead','Serializable']);

export const UserScalarFieldEnumSchema = z.enum(['id','email','name','emailVerified','image','createdAt','updatedAt']);

export const SessionScalarFieldEnumSchema = z.enum(['id','expiresAt','token','createdAt','updatedAt','ipAddress','userAgent','userId']);

export const AccountScalarFieldEnumSchema = z.enum(['id','accountId','providerId','userId','accessToken','refreshToken','idToken','accessTokenExpiresAt','refreshTokenExpiresAt','scope','password','createdAt','updatedAt']);

export const VerificationScalarFieldEnumSchema = z.enum(['id','identifier','value','expiresAt','createdAt','updatedAt']);

export const CategoryScalarFieldEnumSchema = z.enum(['id','name','order','parentId','createdAt','deletedAt']);

export const SnippetScalarFieldEnumSchema = z.enum(['id','title','body','variables','categoryId','favorite','color','order','createdAt','updatedAt','deletedAt']);

export const AlfaSettingsScalarFieldEnumSchema = z.enum(['id','email','apiKey','token','tokenExpiresAt']);

export const SubjectScalarFieldEnumSchema = z.enum(['id','alfacrmId','name','order']);

export const TeacherScalarFieldEnumSchema = z.enum(['id','alfacrmId','name','email','phone','avatarUrl','note']);

export const TeacherSubjectScalarFieldEnumSchema = z.enum(['teacherId','subjectId']);

export const TeacherWorkingHourScalarFieldEnumSchema = z.enum(['id','teacherId','dayIndex','timeFrom','timeTo']);

export const SortOrderSchema = z.enum(['asc','desc']);

export const QueryModeSchema = z.enum(['default','insensitive']);

export const NullsOrderSchema = z.enum(['first','last']);
/////////////////////////////////////////
// MODELS
/////////////////////////////////////////

/////////////////////////////////////////
// USER SCHEMA
/////////////////////////////////////////

export const UserSchema = z.object({
  id: z.string().cuid(),
  email: z.string(),
  name: z.string().nullable(),
  emailVerified: z.boolean(),
  image: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type User = z.infer<typeof UserSchema>

// USER RELATION SCHEMA
//------------------------------------------------------

export type UserRelations = {
  sessions: SessionWithRelations[];
  accounts: AccountWithRelations[];
};

export type UserWithRelations = z.infer<typeof UserSchema> & UserRelations

export const UserWithRelationsSchema: z.ZodType<UserWithRelations> = UserSchema.merge(z.object({
  sessions: z.lazy(() => SessionWithRelationsSchema).array(),
  accounts: z.lazy(() => AccountWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// SESSION SCHEMA
/////////////////////////////////////////

export const SessionSchema = z.object({
  id: z.string(),
  expiresAt: z.coerce.date(),
  token: z.string(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  userId: z.string(),
})

export type Session = z.infer<typeof SessionSchema>

// SESSION RELATION SCHEMA
//------------------------------------------------------

export type SessionRelations = {
  user: UserWithRelations;
};

export type SessionWithRelations = z.infer<typeof SessionSchema> & SessionRelations

export const SessionWithRelationsSchema: z.ZodType<SessionWithRelations> = SessionSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

/////////////////////////////////////////
// ACCOUNT SCHEMA
/////////////////////////////////////////

export const AccountSchema = z.object({
  id: z.string(),
  accountId: z.string(),
  providerId: z.string(),
  userId: z.string(),
  accessToken: z.string().nullable(),
  refreshToken: z.string().nullable(),
  idToken: z.string().nullable(),
  accessTokenExpiresAt: z.coerce.date().nullable(),
  refreshTokenExpiresAt: z.coerce.date().nullable(),
  scope: z.string().nullable(),
  password: z.string().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
})

export type Account = z.infer<typeof AccountSchema>

// ACCOUNT RELATION SCHEMA
//------------------------------------------------------

export type AccountRelations = {
  user: UserWithRelations;
};

export type AccountWithRelations = z.infer<typeof AccountSchema> & AccountRelations

export const AccountWithRelationsSchema: z.ZodType<AccountWithRelations> = AccountSchema.merge(z.object({
  user: z.lazy(() => UserWithRelationsSchema),
}))

/////////////////////////////////////////
// VERIFICATION SCHEMA
/////////////////////////////////////////

export const VerificationSchema = z.object({
  id: z.string(),
  identifier: z.string(),
  value: z.string(),
  expiresAt: z.coerce.date(),
  createdAt: z.coerce.date().nullable(),
  updatedAt: z.coerce.date().nullable(),
})

export type Verification = z.infer<typeof VerificationSchema>

/////////////////////////////////////////
// CATEGORY SCHEMA
/////////////////////////////////////////

export const CategorySchema = z.object({
  id: z.number().int(),
  name: z.string(),
  order: z.number().int(),
  parentId: z.number().int().nullable(),
  createdAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Category = z.infer<typeof CategorySchema>

// CATEGORY RELATION SCHEMA
//------------------------------------------------------

export type CategoryRelations = {
  parent?: CategoryWithRelations | null;
  children: CategoryWithRelations[];
  snippets: SnippetWithRelations[];
};

export type CategoryWithRelations = z.infer<typeof CategorySchema> & CategoryRelations

export const CategoryWithRelationsSchema: z.ZodType<CategoryWithRelations> = CategorySchema.merge(z.object({
  parent: z.lazy(() => CategoryWithRelationsSchema).nullable(),
  children: z.lazy(() => CategoryWithRelationsSchema).array(),
  snippets: z.lazy(() => SnippetWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// SNIPPET SCHEMA
/////////////////////////////////////////

export const SnippetSchema = z.object({
  id: z.number().int(),
  title: z.string(),
  body: z.string(),
  variables: z.string(),
  categoryId: z.number().int(),
  favorite: z.boolean(),
  color: z.string().nullable(),
  order: z.number().int(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
})

export type Snippet = z.infer<typeof SnippetSchema>

// SNIPPET RELATION SCHEMA
//------------------------------------------------------

export type SnippetRelations = {
  category: CategoryWithRelations;
};

export type SnippetWithRelations = z.infer<typeof SnippetSchema> & SnippetRelations

export const SnippetWithRelationsSchema: z.ZodType<SnippetWithRelations> = SnippetSchema.merge(z.object({
  category: z.lazy(() => CategoryWithRelationsSchema),
}))

/////////////////////////////////////////
// ALFA SETTINGS SCHEMA
/////////////////////////////////////////

export const AlfaSettingsSchema = z.object({
  id: z.number().int(),
  email: z.string(),
  apiKey: z.string(),
  token: z.string().nullable(),
  tokenExpiresAt: z.coerce.date().nullable(),
})

export type AlfaSettings = z.infer<typeof AlfaSettingsSchema>

/////////////////////////////////////////
// SUBJECT SCHEMA
/////////////////////////////////////////

export const SubjectSchema = z.object({
  id: z.number().int(),
  alfacrmId: z.number().int().nullable(),
  name: z.string(),
  order: z.number().int(),
})

export type Subject = z.infer<typeof SubjectSchema>

// SUBJECT RELATION SCHEMA
//------------------------------------------------------

export type SubjectRelations = {
  teachers: TeacherSubjectWithRelations[];
};

export type SubjectWithRelations = z.infer<typeof SubjectSchema> & SubjectRelations

export const SubjectWithRelationsSchema: z.ZodType<SubjectWithRelations> = SubjectSchema.merge(z.object({
  teachers: z.lazy(() => TeacherSubjectWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// TEACHER SCHEMA
/////////////////////////////////////////

export const TeacherSchema = z.object({
  id: z.number().int(),
  alfacrmId: z.number().int(),
  name: z.string(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  avatarUrl: z.string().nullable(),
  note: z.string().nullable(),
})

export type Teacher = z.infer<typeof TeacherSchema>

// TEACHER RELATION SCHEMA
//------------------------------------------------------

export type TeacherRelations = {
  subjects: TeacherSubjectWithRelations[];
  workingHours: TeacherWorkingHourWithRelations[];
};

export type TeacherWithRelations = z.infer<typeof TeacherSchema> & TeacherRelations

export const TeacherWithRelationsSchema: z.ZodType<TeacherWithRelations> = TeacherSchema.merge(z.object({
  subjects: z.lazy(() => TeacherSubjectWithRelationsSchema).array(),
  workingHours: z.lazy(() => TeacherWorkingHourWithRelationsSchema).array(),
}))

/////////////////////////////////////////
// TEACHER SUBJECT SCHEMA
/////////////////////////////////////////

export const TeacherSubjectSchema = z.object({
  teacherId: z.number().int(),
  subjectId: z.number().int(),
})

export type TeacherSubject = z.infer<typeof TeacherSubjectSchema>

// TEACHER SUBJECT RELATION SCHEMA
//------------------------------------------------------

export type TeacherSubjectRelations = {
  teacher: TeacherWithRelations;
  subject: SubjectWithRelations;
};

export type TeacherSubjectWithRelations = z.infer<typeof TeacherSubjectSchema> & TeacherSubjectRelations

export const TeacherSubjectWithRelationsSchema: z.ZodType<TeacherSubjectWithRelations> = TeacherSubjectSchema.merge(z.object({
  teacher: z.lazy(() => TeacherWithRelationsSchema),
  subject: z.lazy(() => SubjectWithRelationsSchema),
}))

/////////////////////////////////////////
// TEACHER WORKING HOUR SCHEMA
/////////////////////////////////////////

export const TeacherWorkingHourSchema = z.object({
  id: z.number().int(),
  teacherId: z.number().int(),
  dayIndex: z.number().int(),
  timeFrom: z.string(),
  timeTo: z.string(),
})

export type TeacherWorkingHour = z.infer<typeof TeacherWorkingHourSchema>

// TEACHER WORKING HOUR RELATION SCHEMA
//------------------------------------------------------

export type TeacherWorkingHourRelations = {
  teacher: TeacherWithRelations;
};

export type TeacherWorkingHourWithRelations = z.infer<typeof TeacherWorkingHourSchema> & TeacherWorkingHourRelations

export const TeacherWorkingHourWithRelationsSchema: z.ZodType<TeacherWorkingHourWithRelations> = TeacherWorkingHourSchema.merge(z.object({
  teacher: z.lazy(() => TeacherWithRelationsSchema),
}))
