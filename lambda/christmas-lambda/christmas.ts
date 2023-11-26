import { APIGatewayProxyEvent, APIGatewayProxyResult } from "aws-lambda";
import { ChristmasItem, ChristmasItemImpl } from "./christmas-types";
import * as christmasService from './christmas-service';

export const handler = async(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    const headers = {
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Credentials': true
    };
    switch(event.httpMethod) {
        case 'GET':
            try {
                const allItems: ChristmasItem[] = await christmasService.getAllItems();
                return {
                    statusCode: 200,
                    headers,
                    body: JSON.stringify(allItems)
                }
            } catch(e) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        errorMessage: 'Error retrieving all items'
                    })
                }
            }
        case 'POST':
            let item: ChristmasItem = new ChristmasItemImpl(event.body && JSON.parse(event.body));
            try {
                item = await christmasService.createItem(item);
                return {
                    statusCode: 201,
                    headers,
                    body: JSON.stringify(item)
                }
            } catch(e) {
                return {
                    statusCode: 500,
                    headers,
                    body: JSON.stringify({
                        errorMessage: `Error creating item with name '${item.itemName}'`
                    })
                }
            }
        default:
            return {
                statusCode: 405,
                headers,
                body: JSON.stringify({
                    errorMessage: 'Operation not supported'
                })
            }
    }
}
