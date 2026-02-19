export class ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    time: Date;
    constructor(id: string, sender: 'user' | 'bot', text: string, time: Date) {
        this.id = id;
        this.sender = sender;
        this.text = text;
        this.time = time;
    }
}
