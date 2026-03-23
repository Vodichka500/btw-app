import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@btw-app/server'
import { inferRouterInputs, inferRouterOutputs } from '@trpc/server'

// Эта строчка создает все наши React-хуки (useQuery, useMutation),
// опираясь на типы из нашего общего пакета shared!
export const trpc = createTRPCReact<AppRouter>()

export type RouterInput = inferRouterInputs<AppRouter>
export type RouterOutput = inferRouterOutputs<AppRouter>

export type CategoryNode = RouterOutput['categories']['getAll'][number]
export type SnippetNode = RouterOutput['snippets']['getAll'][number]
export type UpdatedSnippet = RouterOutput['snippets']['update']
export type DeletedSnippet = RouterOutput['snippets']['softDelete']
type RawTrashOutput = RouterOutput['trash']['getTrash']

export type TrashCategory = RawTrashOutput['categories'][number] & {
  type: 'category'
}

export type TrashSnippet = RawTrashOutput['snippets'][number] & {
  type: 'snippet'
  name: string
}

export type TrashItem =
  | (RawTrashOutput['categories'][number] & { type: 'category' })
  | (RawTrashOutput['snippets'][number] & { type: 'snippet'; name: string })

export type GroupedTrashItem = (TrashCategory & { children: TrashSnippet[] }) | TrashSnippet

export type TeacherNode = RouterOutput['teachers']['getAll'][number]
