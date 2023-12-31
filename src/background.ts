import {Config} from "./modules/Config";
import {StorageClient} from "./modules/StorageClient";
import {Tweet} from "./modules/models";

import MessageSender = chrome.runtime.MessageSender;

class BackgroundScript {
    private storage: StorageClient;

    private constructor(
        private config: Config,
    ) {
        this.storage = new StorageClient(config.awsAccessKeyId, config.awsSecretAccessKey, config.awsRegion, config.awsEndpoint);
        console.log('Background script loaded.');
    }

    static async run() {
        const background = new BackgroundScript(await Config.create());
        await background.initializeListeners();
    }

    private async initializeListeners() {
        chrome.runtime.onInstalled.addListener(
            (details) => {
                console.log("WhisperSphere extension installed.", details);
            }
        );
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) =>
                this.handleMessage(message, sender, sendResponse)
        );
    }

    private handleMessage(message: any, sender: MessageSender, sendResponse: (response?: any) => void) {
        try {
            if (message.type === 'newTweet') {
                const tweet = Tweet.from(message.tweet).withTtlDays(this.config.ttl_days);
                this.storage.save(tweet).then();
                sendResponse({status: 'saved'});
            }
        } catch (e) {
            console.error('Error handling message:', e);
        }
        return true;
    }
}

BackgroundScript.run().then();
