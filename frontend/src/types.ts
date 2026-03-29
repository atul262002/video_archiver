export type PreservationSuggestionKind = 'video' | 'channel' | 'social' | 'blog';

export interface PreservationSuggestion {
    id: string;
    kind: PreservationSuggestionKind;
    reference: string;
    note: string;
    createdAt: string;
    archived?: boolean;
}

export interface Video {
  id: string;
  title: string;
  creator: string;
  date: string;
  tags: string[];
  description: string;
  category: string;
  thumbnailUrl?: string;
  /** Set by the server when stored in MongoDB */
  createdAt?: string;
  updatedAt?: string;
  platforms: {
    youtube?: string;
    googleDrive?: string;
    odysee?: string;
    rumble?: string;
    bitChute?: string;
  };
}
