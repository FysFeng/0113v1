// 由于 html2canvas 是通过 CDN (importmap) 引入的外部依赖，
// 本地没有安装 node_modules/html2canvas，
// 因此我们需要手动声明这个模块，防止 TypeScript 编译报错。

declare module 'html2canvas' {
  export interface Options {
    allowTaint?: boolean;
    backgroundColor?: string | null;
    canvas?: HTMLCanvasElement;
    foreignObjectRendering?: boolean;
    imageTimeout?: number;
    ignoreElements?: (element: Element) => boolean;
    logging?: boolean;
    onclone?: (doc: Document) => void;
    proxy?: string;
    removeContainer?: boolean;
    scale?: number;
    useCORS?: boolean;
    width?: number;
    height?: number;
    x?: number;
    y?: number;
    scrollX?: number;
    scrollY?: number;
    windowWidth?: number;
    windowHeight?: number;
  }

  function html2canvas(element: HTMLElement, options?: Partial<Options>): Promise<HTMLCanvasElement>;
  
  export default html2canvas;
}