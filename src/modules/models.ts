export abstract class WhisperSphereObject {
    abstract type: string
    abstract timestamp: number
    ttl: number = 0

    public withTtlDays(ttlDays: number) {
        this.ttl = Math.floor(this.timestamp / 1000) + ttlDays * 24 * 60 * 60
        return this
    }

    static from<T extends WhisperSphereObject>(this: new (...args: any[]) => T, data: Partial<T>): T {
        const obj = new this();
        for (const key of Object.keys(data)) {
            (obj as any)[key] = (data as any)[key];
        }
        return obj;
    }

    public marshal() {
        return {
            type: this.type,
            timestamp: this.timestamp,
            ttl: this.ttl,
            data: JSON.stringify(this.marshalData()),
        }
    }

    protected marshalData() {
        const data: {[key: string]: any} = {};

        this.marshalKeys().forEach(key => {
            data[key] = (this as any)[key];
        });

        return data;
    }

    protected marshalKeys(): string[] {
        return []
    }
}


export class Tweet extends WhisperSphereObject {
    type = "tweet"

    constructor(
        public readonly timestamp: number,
        public readonly tweetId: string,
        public readonly tweetTime: number,
        public readonly userId: string,
        public readonly text: string,
    ) {
        super();
    }

    public marshalKeys(): string[]{
        return [
            "tweetId",
            "tweetTime",
            "userId",
            "text",
        ]
    }
}
