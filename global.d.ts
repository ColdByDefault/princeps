/**
 * @author ColdByDefault
 * @copyright 2026 ColdByDefault
 * @license See License
 * @version beta
 * @since beta
 * @module
 * @description
 */

// CSS module declarations
declare module "*.css" {
  const content: string;
  export default content;
}

declare module "*.scss" {
  const content: string;
  export default content;
}

declare module "*.sass" {
  const content: string;
  export default content;
}

declare module "*.less" {
  const content: string;
  export default content;
}

// Image module declarations
declare module "*.png" {
  const content: string;
  export default content;
}

declare module "*.jpg" {
  const content: string;
  export default content;
}

declare module "*.jpeg" {
  const content: string;
  export default content;
}

declare module "*.gif" {
  const content: string;
  export default content;
}

declare module "*.svg" {
  const content: string;
  export default content;
}

declare module "*.webp" {
  const content: string;
  export default content;
}

// Font module declarations
declare module "*.woff" {
  const content: string;
  export default content;
}

declare module "*.woff2" {
  const content: string;
  export default content;
}

declare module "*.ttf" {
  const content: string;
  export default content;
}

declare module "*.otf" {
  const content: string;
  export default content;
}

// Web Speech API — not included in TS 5.9 DOM lib
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionResultEvent extends Event {
  readonly results: SpeechRecognitionResultList;
  readonly resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  readonly error: string;
}

// eslint-disable-next-line no-var
declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface Window {
  SpeechRecognition: typeof SpeechRecognition;
  webkitSpeechRecognition: typeof SpeechRecognition;
}
