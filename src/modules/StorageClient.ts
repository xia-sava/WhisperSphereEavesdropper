import {Tweet} from "./Tweet";

import {
    CreateTableCommand,
    DescribeTableCommand,
    DynamoDB,
    ListTablesCommand,
    PutItemCommand,
    UpdateTimeToLiveCommand
} from "@aws-sdk/client-dynamodb";
import {marshall} from "@aws-sdk/util-dynamodb";


const TABLE_NAME = "WhisperSphere_Tweets";


export class StorageClient {
    private dynamoDb: DynamoDB;

    constructor(awsAccessKeyId: string, awsSecretAccessKey: string, awsRegion: string, debugAwsEndpoint: string | null = null) {
        this.dynamoDb = new DynamoDB({
            ...{
                region: awsRegion,
                credentials: {
                    accessKeyId: awsAccessKeyId,
                    secretAccessKey: awsSecretAccessKey,
                },
            },
            ...(debugAwsEndpoint ? {endpoint: debugAwsEndpoint} : {})
        });
    }

    async connect() {
        await this.dynamoDb.send(new ListTablesCommand({}));
    }

    async disconnect() {
        // 削除処理をしちゃうかどうか
    }

    async tableExists(tableName: string = TABLE_NAME) {
        const listTablesCommand = new ListTablesCommand({});
        const listTablesResponse = await this.dynamoDb.send(listTablesCommand);
        console.log("listTables:", listTablesResponse);
        if (listTablesResponse.TableNames?.indexOf(tableName) === -1) {
            return false;
        }

        const describeTableCommand = new DescribeTableCommand({TableName: tableName})
        const describeTableResponse = await this.dynamoDb.send(describeTableCommand);
        console.log("describeTables", describeTableResponse);
        return describeTableResponse.Table?.TableStatus === "ACTIVE";
    }

    async createTables() {
        const createTweetsTableCommand = new CreateTableCommand({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: "userId",
                    AttributeType: "S",
                },
                {
                    AttributeName: "timestamp",
                    AttributeType: "S",
                },
            ],
            KeySchema: [
                {
                    AttributeName: "userId",
                    KeyType: "HASH",
                },
                {
                    AttributeName: "timestamp",
                    KeyType: "RANGE",
                },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
        });
        console.log("create table", createTweetsTableCommand);
        await this.dynamoDb.send(createTweetsTableCommand);
        while (! await this.tableExists()) {
            await new Promise(res => setTimeout(res, 3000));
        }

        const updateTweetsTableCommand = new UpdateTimeToLiveCommand({
            TableName: "WebSphere_Tweets",
            TimeToLiveSpecification: {
                AttributeName: "ttl",
                Enabled: true,
            },
        });
        await this.dynamoDb.send(updateTweetsTableCommand)
    }

    async saveTweet(tweet: Tweet) {
        try {
            const putCommand = new PutItemCommand({
                TableName: TABLE_NAME,
                Item: marshall(tweet),
            });
            await this.dynamoDb.send(putCommand);
            console.log("Tweet saved:", tweet);
        } catch (error) {
            console.error("Error saving tweet:", error);
        }
    }
}
