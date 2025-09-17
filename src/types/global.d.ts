declare global {
  interface Window {
    SB?: {
      url?: string;
      anon?: string;
    };
  }
}

declare module '*.svg' {
  const src: string;
  export default src;
}

export {};
