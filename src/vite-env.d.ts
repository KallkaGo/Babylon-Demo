/// <reference types="vite/client" />

declare module '*.glb' {
  const src: string;
  export default src;
}

declare module '*.dds' {
  const src: string;
  export default src;
}

declare module '*.gltf' {
  const value: string;
  export = value;
}

declare module '*.hdr' {
  const src: string;
  export default src;
}


declare module '*.exr' {
  const src: string;
  export default src;
}
