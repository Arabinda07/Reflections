export interface NoteAttachment {
  name: string;
  path: string;
  size: number;
  type: string;
  id: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string; // ISO Date string
  updatedAt: string;
  thumbnailUrl?: string;
  tags?: string[];
  attachments?: NoteAttachment[];
  mood?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

export enum RoutePath {
  HOME = '/',
  NOTES = '/notes',
  CREATE_NOTE = '/notes/new',
  EDIT_NOTE = '/notes/:id/edit',
  NOTE_DETAIL = '/notes/:id',
  ACCOUNT = '/account',
  LOGIN = '/login',
  SIGNUP = '/signup',
}