# convey
Convey is a serverless gateway to an Elasticsearch instance.

## API
### `POST /index`
Indexes a document in Elasticsearch.

#### Example
##### Request Body (`JSON`)
```json
{
    "secret": "your-secret-here",
    "index": "some-index",
    "type": "some-type",
    "field1": "a field",
    "field2": "another field",
    "field3": "yet another field"
}
```

##### Result
Indexes the following document in Elasticsearch:

```json
{
    "index": "some-index",
    "type": "some-type",
    "body": {
        "field1": "a field",
        "field2": "another field",
        "field3": "yet another field"
    }
}
```