export class Tweet {
    constructor(
        public readonly userId: string,
        public readonly timestamp: string,
        public readonly ttl: number,
        public readonly tweetTime: number,
        public readonly tweetId: string,
        public readonly text: string,
    ) {}
}
