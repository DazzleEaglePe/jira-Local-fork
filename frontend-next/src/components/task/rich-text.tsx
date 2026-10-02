"use client"

import { useMemo } from "react"
import Placeholder from "@tiptap/extension-placeholder"
import { EditorContent, useEditor, useEditorState, type Editor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import DOMPurify from "dompurify"
import { Bold, Code, Italic, List, ListOrdered, Quote, type LucideIcon } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { cn } from "@/lib/utils"

/** Vikunja stores descriptions/comments as HTML; render it sanitized. */
export function RichTextView({ html, className }: { html?: string | null; className?: string }) {
  const clean = useMemo(() => (html ? DOMPurify.sanitize(html) : ""), [html])
  return <div className={cn("rich-text", className)} dangerouslySetInnerHTML={{ __html: clean }} />
}

export function isEmptyHtml(html?: string | null): boolean {
  return !html || html.replace(/<[^>]*>/g, "").trim() === ""
}

type ToolbarAction = { label: string; icon: LucideIcon; isActive: (editor: Editor) => boolean; run: (editor: Editor) => void }

const ACTIONS: ToolbarAction[] = [
  { label: "Negrita", icon: Bold, isActive: (e) => e.isActive("bold"), run: (e) => e.chain().focus().toggleBold().run() },
  { label: "Cursiva", icon: Italic, isActive: (e) => e.isActive("italic"), run: (e) => e.chain().focus().toggleItalic().run() },
  { label: "Lista", icon: List, isActive: (e) => e.isActive("bulletList"), run: (e) => e.chain().focus().toggleBulletList().run() },
  { label: "Lista numerada", icon: ListOrdered, isActive: (e) => e.isActive("orderedList"), run: (e) => e.chain().focus().toggleOrderedList().run() },
  { label: "Código", icon: Code, isActive: (e) => e.isActive("codeBlock"), run: (e) => e.chain().focus().toggleCodeBlock().run() },
  { label: "Cita", icon: Quote, isActive: (e) => e.isActive("blockquote"), run: (e) => e.chain().focus().toggleBlockquote().run() },
]

function Toolbar({ editor }: { editor: Editor }) {
  // Re-render the toolbar on selection/format changes (Tiptap v3 recommended pattern)
  const active = useEditorState({ editor, selector: ({ editor: e }) => ACTIONS.map((action) => action.isActive(e)) })

  return (
    <div role="toolbar" aria-label="Formato" className="flex gap-0.5 border-b p-1">
      {ACTIONS.map((action, index) => (
        <Button
          key={action.label}
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={action.label}
          aria-pressed={active[index]}
          className={cn(active[index] && "bg-selected text-selected-foreground")}
          onClick={() => action.run(editor)}
        >
          <action.icon />
        </Button>
      ))}
    </div>
  )
}

/** Jira-style editor: toolbar, content, Guardar / Cancelar. */
export function RichTextEditor({
  initialHtml,
  placeholder,
  saving,
  saveLabel = "Guardar",
  onSave,
  onCancel,
}: {
  initialHtml?: string | null
  placeholder: string
  saving?: boolean
  saveLabel?: string
  onSave: (html: string) => void
  onCancel?: () => void
}) {
  const editor = useEditor({
    extensions: [StarterKit, Placeholder.configure({ placeholder })],
    content: initialHtml ?? "",
    autofocus: "end",
    immediatelyRender: false, // required with SSR to avoid hydration mismatches
    editorProps: {
      attributes: { class: "rich-text min-h-24 px-3 py-2 focus:outline-none", "aria-label": placeholder },
    },
  })

  if (!editor) return <div className="min-h-32 rounded-md border" />

  const save = () => onSave(editor.isEmpty ? "" : editor.getHTML())

  return (
    <div className="flex flex-col gap-2">
      <div
        className="rounded-md border border-input focus-within:ring-3 focus-within:ring-ring/50"
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
            event.preventDefault()
            save()
          }
          if (event.key === "Escape" && onCancel) onCancel()
        }}
      >
        <Toolbar editor={editor} />
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={save} disabled={saving}>
          {saving && <Spinner />} {saveLabel}
        </Button>
        {onCancel && (
          <Button size="sm" variant="ghost" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <span className="ml-auto text-xs text-muted-foreground">Ctrl + Enter para guardar</span>
      </div>
    </div>
  )
}
