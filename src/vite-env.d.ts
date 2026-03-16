/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ANTHROPIC_API_KEY?: string
  readonly VITE_AI_PROVIDER?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  interimResults: boolean
  lang: string
  onstart: (() => void) | null
  onresult: ((ev: SpeechRecognitionEvent) => void) | null
  onend: (() => void) | null
  onerror: ((ev: Event) => void) | null
  start(): void
  stop(): void
  abort(): void
}

interface SpeechRecognitionEvent extends Event {
  readonly results: SpeechRecognitionResultList
}
