import {SVGProps} from "react";

export type IconSvgProps = SVGProps<SVGSVGElement> & {
  size?: number;
};

export interface Source {
  id: number,
  messageId: number,
  content: string,
  refference: string
}

export interface Message {
  id: number,
  content: string,
  query: string | undefined,
  fromChatbot: boolean
}
