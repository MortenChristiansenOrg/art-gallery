import type { Id } from "../../../convex/_generated/dataModel";

export interface MockMessage {
  _id: Id<"messages">;
  _creationTime: number;
  name: string;
  email: string;
  message: string;
  read: boolean;
  createdAt: number;
}

let messageIdCounter = 1;

export function createMockMessage(
  overrides: Partial<MockMessage> = {}
): MockMessage {
  const id = messageIdCounter++;
  return {
    _id: `message_${id}` as Id<"messages">,
    _creationTime: Date.now(),
    name: `Test User ${id}`,
    email: `user${id}@example.com`,
    message: `Test message content ${id}`,
    read: false,
    createdAt: Date.now(),
    ...overrides,
  };
}

export function createMockMessageList(count: number): MockMessage[] {
  return Array.from({ length: count }, () => createMockMessage());
}

export function resetMessageIdCounter(): void {
  messageIdCounter = 1;
}
