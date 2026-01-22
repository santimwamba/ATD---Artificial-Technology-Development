
export interface Attachment {
  mimeType: string;
  data: string; // Base64 string
  fileName: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  attachment?: Attachment;
}

export interface UserSession {
  email: string;
  isLoggedIn: boolean;
}

export enum AuthMode {
  LOGIN = 'LOGIN',
  SUBSCRIBE = 'SUBSCRIBE',
  RESET = 'RESET'
}

export interface ApiError {
  code: number;
  error_code: string;
  msg: string;
}
