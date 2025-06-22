import { EditorEvents } from '@tiptap/core'

declare module '@tiptap/core' {
  interface EditorEvents {
    ghostTextTrigger: (props: { position: number; context: string }) => void
    ghostTextAccept: (text: string) => void
    ghostTextReject: () => void
  }
} 