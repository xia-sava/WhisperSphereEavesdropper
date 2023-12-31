import {Config} from "./modules/Config";
import {Tweet} from "./modules/models";

import MessageSender = chrome.runtime.MessageSender;

class ContentScript {
    private constructor(
        private config: Config,
    ) {
        console.log('WhisperSphere ContentScript installed.');
    }

    static async run() {
        const content = new ContentScript(await Config.create());
        content.initializeEventListeners();
        await content.setTweetColumnWaiter();
    }

    private initializeEventListeners() {
        chrome.runtime.onMessage.addListener(
            (message, sender, sendResponse) =>
                this.handleMessage(message, sender, sendResponse)
        );
    }

    private handleMessage(message: any, sender: MessageSender, sendResponse: (response?: any) => void) {
        if (sender.id === chrome.runtime.id) {
            if (message.type === "reloadConfig") {
                this.config.load().then();
                sendResponse({status: 'reloaded'});
            }
        }
        return true;
    }

    // ツイートカラムの出現を待機して，新着ツイート処理を追加する
    private async setTweetColumnWaiter() {
        // TweetDeck のカラムのセレクタ
        const column = document.querySelector('.js-column[data-column]:first-child');
        if (column) {
            // 新着ツイート検出処理を走行
            await this.waitForNewTweets(column)

        } else {
            setTimeout(() => this.setTweetColumnWaiter(), 5000);
        }
    }

    // ツイートカラムの更新を待機して新着ツイートを検出する
    async waitForNewTweets(tweetColumn: Element) {
        console.log('Waiting for new tweets...');
        new MutationObserver(
            async (mutations, _) => {
                if (this.config.enabled) {
                    for (const mutation of mutations) {
                        let seq = 0
                        for (const addedNode of Array.from(mutation.addedNodes).reverse()) {
                            if (addedNode instanceof HTMLElement && addedNode.tagName === 'ARTICLE') {
                                seq = await this.handleNewTweet(addedNode, ++seq);
                            }
                        }
                    }
                }
            }
        )
            .observe(tweetColumn, {childList: true, subtree: true});
    }

    // 新着ツイートを service worker に送信する
    async handleNewTweet(tweetArticle: HTMLElement, seq: number) {
        try {
            const timestamp = Date.now();
            const userId = (tweetArticle.getAttribute('data-account-key') ?? "").replace("twitter:", "");
            const tweetId = tweetArticle.getAttribute('data-tweet-id') ?? "";
            const tweetTime = parseInt(tweetArticle.querySelector('time')?.getAttribute('data-time') ?? "0") / 1000;
            const tweetText = tweetArticle.querySelector('.tweet-text')?.textContent ?? ""

            if (tweetId) {
                const tweet = new Tweet(
                    timestamp * 1000 + seq,
                    tweetId,
                    tweetTime,
                    userId,
                    tweetText,
                )
                const result = await chrome.runtime.sendMessage({
                    type: 'newTweet',
                    tweet: tweet,
                });
                console.log('message sent:', tweet, result);
            }
        } catch (e) {
            console.error('Error sending message:', e);
        }
        return seq
    }
}

ContentScript.run().then();
