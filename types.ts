
export interface GeneratedImage {
  id: string;
  url: string; // Base64 encoded image URL
  prompt: string;
  aspectRatio: AspectRatio;
  remixedFrom?: string; // URL of the image it was remixed from
}

export enum AspectRatio {
  SQUARE = '1:1',
  PORTRAIT_PHONE = '9:16',
  PORTRAIT_TABLET = '3:4',
  LANDSCAPE_TABLET = '4:3',
  LANDSCAPE_WIDESCREEN = '16:9',
}
    