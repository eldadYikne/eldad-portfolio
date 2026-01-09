export type MessageItem = {
  itemId: string;
  type: "message";
  role: "user" | "assistant";
  status: string;
  content: {
    type: "input_audio" | "output_audio";
    transcript: string;
    audio: string;
  }[];
};
