"use client"

import { useState } from "react"
import { formatDistanceToNow, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { Trash2 } from "lucide-react"
import { toast } from "sonner"

import { initials } from "@/components/shell/user-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getErrorMessage } from "@/lib/api/client"
import { useSession } from "@/lib/auth/session-store"
import { useAddComment, useComments, useDeleteComment } from "@/lib/queries/task-detail"
import { RichTextEditor, RichTextView, isEmptyHtml } from "./rich-text"

function timeAgo(value?: string) {
  if (!value) return ""
  return formatDistanceToNow(parseISO(value), { addSuffix: true, locale: es })
}

/** Jira "Actividad › Comentarios": list oldest first, composer at the bottom. */
export function TaskComments({ taskId }: { taskId: number }) {
  const me = useSession((state) => state.user)
  const comments = useComments(taskId)
  const addComment = useAddComment(taskId)
  const deleteComment = useDeleteComment(taskId)
  const [composing, setComposing] = useState(false)

  async function onSave(html: string) {
    if (isEmptyHtml(html)) return
    try {
      await addComment.mutateAsync(html)
      setComposing(false)
    } catch (error) {
      toast.error(getErrorMessage(error, "No se pudo publicar el comentario"))
    }
  }

  return (
    <section aria-labelledby="activity-heading" className="flex flex-col gap-3">
      <h2 id="activity-heading" className="font-semibold">
        Actividad <span className="font-normal text-muted-foreground">· Comentarios</span>
      </h2>

      {comments.isPending ? (
        <Skeleton className="h-16" />
      ) : (
        <ol className="flex flex-col gap-4">
          {(comments.data ?? []).map((comment) => {
            const author = comment.author
            const name = author?.name || author?.username || "?"
            return (
              <li key={comment.id} className="group flex gap-3">
                <Avatar className="size-8">
                  <AvatarFallback className="bg-discovery text-[11px] font-semibold text-white">{initials(name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="flex items-baseline gap-2 text-sm">
                    <span className="font-semibold">{name}</span>
                    <time dateTime={comment.created} className="text-xs text-muted-foreground">
                      {timeAgo(comment.created)}
                    </time>
                    {author?.id === me?.id && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="ml-auto opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        aria-label="Eliminar comentario"
                        onClick={() =>
                          deleteComment.mutate(comment.id as number, {
                            onError: (error) => toast.error(getErrorMessage(error, "No se pudo eliminar el comentario")),
                          })
                        }
                      >
                        <Trash2 />
                      </Button>
                    )}
                  </p>
                  <RichTextView html={comment.comment} className="mt-1 text-sm" />
                </div>
              </li>
            )
          })}
        </ol>
      )}

      <div className="flex gap-3">
        <Avatar className="size-8">
          <AvatarFallback className="bg-information text-[11px] font-semibold text-white">
            {initials(me?.name || me?.username || "")}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          {composing ? (
            <RichTextEditor
              placeholder="Añadir un comentario…"
              saving={addComment.isPending}
              onSave={(html) => void onSave(html)}
              onCancel={() => setComposing(false)}
            />
          ) : (
            <button
              type="button"
              onClick={() => setComposing(true)}
              className="w-full rounded-md border border-input px-3 py-2 text-left text-muted-foreground hover:bg-accent"
            >
              Añadir un comentario…
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
