export class Config {
    public enabled: boolean = false;
    public ttl_days: number = 3;
    public awsAccessKeyId: string = "";
    public awsSecretAccessKey: string = "";
    public awsRegion: string = "ap-northeast-1";
    public connected: boolean = false;
    public debugAwsEndpoint: string = "";

    private constructor() {
    }

    static async create() {
        const config = new Config();
        await config.load()
        return config;
    }

    async set<T extends keyof Config>(name: T, value: Config[T]) {
        (this as Config)[name] = value;
        await this.save()
    }

    async load() {
        const keyDefaults: {[p: string]: any} = Object.assign({}, this)
        const items = await chrome.storage.sync.get(keyDefaults);
        this.enabled = items.enabled;
        this.ttl_days = items.ttl_days;
        this.awsAccessKeyId = items.awsAccessKeyId;
        this.awsSecretAccessKey = items.awsSecretAccessKey;
        this.awsRegion = items.awsRegion;
        this.connected = items.connected;
        this.debugAwsEndpoint = items.debugAwsEndpoint;
    }

    async save() {
        const keyValues: {[p: string]: any} = Object.assign({}, this)
        await chrome.storage.sync.set(keyValues);
        console.log("saved config:", this)
    }
}
