export interface Video {
  id: string;
  title: string;
  creator: string;
  date: string;
  tags: string[];
  description: string;
  category: string;
  thumbnailUrl?: string;
  platforms: {
    youtube?: string;
    googleDrive?: string;
    odysee?: string;
    rumble?: string;
    bitChute?: string;
  };
}
