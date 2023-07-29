import {StorageClient} from "../modules/StorageClient";
import {Config} from "../modules/Config";

class OptionsUI {
    private enabled: HTMLInputElement;
    private ttl_days: HTMLInputElement;
    private awsAccessKeyId: HTMLInputElement;
    private awsSecretAccessKey: HTMLInputElement;
    private awsRegion: HTMLInputElement;
    private connectButton: HTMLButtonElement;
    private disconnectButton: HTMLButtonElement;
    private connectionStatus: HTMLParagraphElement;
    private connected: boolean;
    private debugAwsEndpoint: HTMLInputElement;

    private constructor(
        private config: Config,
    ) {
        this.enabled = document.getElementById("enabled") as HTMLInputElement;
        this.ttl_days = document.getElementById("ttl_days") as HTMLInputElement;
        this.awsAccessKeyId = document.getElementById("awsAccessKeyId") as HTMLInputElement;
        this.awsSecretAccessKey = document.getElementById("awsSecretAccessKey") as HTMLInputElement;
        this.awsRegion = document.getElementById("awsRegion") as HTMLInputElement;
        this.connectButton = document.getElementById("connectButton") as HTMLButtonElement;
        this.disconnectButton = document.getElementById("disconnectButton") as HTMLButtonElement;
        this.connectionStatus = document.getElementById("connectionStatus") as HTMLParagraphElement;
        this.connected = false;
        this.debugAwsEndpoint = document.getElementById("debugAwsEndpoint") as HTMLInputElement;
    }

    static async run() {
        const optionsUi = new OptionsUI(await Config.create());
        optionsUi.updateUiState();
        optionsUi.initializeEventListeners();
        console.log("loaded config:", optionsUi.config);
    }

    // AWS 資格情報に応じて接続・切断ボタンを en/dis します．
    private updateUiState() {
        this.enabled.checked = this.config.enabled;
        this.ttl_days.valueAsNumber = this.config.ttl_days;
        this.awsAccessKeyId.value = this.config.awsAccessKeyId;
        this.awsSecretAccessKey.value = this.config.awsSecretAccessKey;
        this.awsRegion.value = this.config.awsRegion;
        this.connected = this.config.connected;
        this.debugAwsEndpoint.value = this.config.debugAwsEndpoint;

        this.enabled.disabled = true;
        this.connectButton.disabled = true;
        this.disconnectButton.disabled = true;
        if (this.connected) {
            this.enabled.disabled = false;
            this.disconnectButton.disabled = false;
        } else if (this.awsAccessKeyId.value && this.awsSecretAccessKey.value && this.awsRegion.value) {
            this.connectButton.disabled = false;
        }
    }

    private initializeEventListeners() {
        this.enabled.addEventListener("change", async () => {
            await this.setConfig("enabled", this.enabled.checked);
        });
        this.ttl_days.addEventListener("change", async () => {
            await this.setConfig("ttl_days", this.ttl_days.valueAsNumber);
        });
        this.awsAccessKeyId.addEventListener("change", async () => {
            await this.setConfig("awsAccessKeyId", this.awsAccessKeyId.value);
            this.updateUiState();
        });
        this.awsSecretAccessKey.addEventListener("change", async () => {
            await this.setConfig("awsSecretAccessKey", this.awsSecretAccessKey.value);
        });
        this.awsRegion.addEventListener("change", async () => {
            await this.setConfig("awsRegion", this.awsRegion.value);
        });
        this.debugAwsEndpoint.addEventListener("change", async () => {
            await this.setConfig("debugAwsEndpoint", this.debugAwsEndpoint.value);
        });
        this.connectButton.addEventListener("click", async () => {
            await this.connect();
        });
        this.disconnectButton.addEventListener("click", async () => {
            await this.disconnect();
        });
    }

    private async setConfig<T extends keyof Config>(name: T, value: Config[T]) {
        await this.config.set(name, value);

        this.updateUiState();
        await this.notifyConfigChanged()
    }

    private getStorageClient() {
        const awsAccessKeyId = this.awsAccessKeyId.value;
        const awsSecretAccessKey = this.awsSecretAccessKey.value;
        const awsRegion = this.awsRegion.value;
        const debugAwsEndpoint = this.debugAwsEndpoint.value;
        return new StorageClient(awsAccessKeyId, awsSecretAccessKey, awsRegion, debugAwsEndpoint);
    }

    // AWS に接続します
    private async connect() {
        if (this.awsAccessKeyId.value && this.awsSecretAccessKey.value && this.awsRegion.value) {
            try {
                const storage = this.getStorageClient()
                await storage.connect();
                if (!await storage.tableExists()) {
                    await storage.createTables();
                }
                await this.setConfig("connected", true);
                await this.setConfig("enabled", true);
                this.connectionStatus.textContent = `connection succeed!`;
            } catch (e) {
                console.error("connection failed", e)
                this.connectionStatus.textContent = `connection failed: ${e}`;
            }
        }
    }

    private async disconnect() {
        try {
            if (this.connected) {
                const storage = this.getStorageClient()
                await storage.disconnect();
                await this.setConfig("connected", false);
                await this.setConfig("enabled", false);
                this.connectionStatus.textContent = `disconnected.`;
            }
        } catch (e) {
            console.error("connection failed", e)
            this.connectionStatus.textContent = `connection failed: ${e}`;
        }
    }

    private async notifyConfigChanged() {
        const tabs = await chrome.tabs.query({ url: 'https://tweetdeck.twitter.com/*' });
        for (const tab of tabs) {
            if (tab.id) {
                await chrome.tabs.sendMessage(tab.id, { type: "reloadConfig" });
            }
        }
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await OptionsUI.run();
});
