export interface User {
  id: string;
  email?: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  online: boolean;
  lastSeen?: string;
}

export interface Chat {
  id: string;
  isGroup: boolean;
  name?: string;
  avatarUrl?: string;
  members: GroupMember[];
  lastMessage?: Message;
  unreadCount?: number;
}

export interface GroupMember {
  id: string;
  userId: string;
  role: string;
  user: User;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  content?: string;
  type: "text" | "image" | "file" | "system";
  mediaUrl?: string;
  mediaType?: string;
  replyToId?: string;
  createdAt: string;
  sender: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  readBy?: ReadReceipt[];
}

export interface ReadReceipt {
  id: string;
  messageId: string;
  userId: string;
  status: "delivered" | "read";
  readAt: string;
}

export interface Contact {
  id: string;
  username: string;
  displayName: string;
  avatarUrl?: string;
  online: boolean;
  lastSeen?: string;
}
