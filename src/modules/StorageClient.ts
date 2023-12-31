import {WhisperSphereObject} from "./models";

import {
    CreateTableCommand,
    DescribeTableCommand,
    DynamoDB,
    ListTablesCommand,
    PutItemCommand,
    UpdateTimeToLiveCommand
} from "@aws-sdk/client-dynamodb";
import {marshall} from "@aws-sdk/util-dynamodb";


const TABLE_NAME = "WhisperSphere";


export class StorageClient {
    private dynamoDb: DynamoDB;

    constructor(awsAccessKeyId: string, awsSecretAccessKey: string, awsRegion: string, awsEndpoint: string | null = null) {
        this.dynamoDb = new DynamoDB({
            ...{
                region: awsRegion,
                credentials: {
                    accessKeyId: awsAccessKeyId,
                    secretAccessKey: awsSecretAccessKey,
                },
            },
            ...(awsEndpoint ? {endpoint: awsEndpoint} : {})
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
        const createTableCommand = new CreateTableCommand({
            TableName: TABLE_NAME,
            AttributeDefinitions: [
                {
                    AttributeName: "type",
                    AttributeType: "S",
                },
                {
                    AttributeName: "timestamp",
                    AttributeType: "N",
                },
            ],
            KeySchema: [
                {
                    AttributeName: "type",
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
        console.log("create table", createTableCommand);
        await this.dynamoDb.send(createTableCommand);
        while (! await this.tableExists()) {
            await new Promise(res => setTimeout(res, 3000));
        }

        const updateTableCommand = new UpdateTimeToLiveCommand({
            TableName: TABLE_NAME,
            TimeToLiveSpecification: {
                AttributeName: "ttl",
                Enabled: true,
            },
        });
        await this.dynamoDb.send(updateTableCommand)
    }

    async save(obj: WhisperSphereObject) {
        try {
            const putCommand = new PutItemCommand({
                TableName: TABLE_NAME,
                Item: marshall(obj.marshal()),
            });
            await this.dynamoDb.send(putCommand);
            console.log(`${obj.type} saved:`, obj);
        } catch (error) {
            console.error(`Error saving ${obj.type}:`, error);
        }
    }
}
