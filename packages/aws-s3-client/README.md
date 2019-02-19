# `@tradle/aws-s3-client`

> TODO: description

## Usage

### Initialization

```js
import { S3 } from 'aws-sdk'
import { createClient, wrapBucket, wrapBucketMemoized } from '@tradle/aws-s3-client'

const s3 = new S3()
const client = createClient({
  client: s3
})

// you can use the client directly,
// or you can wrap a bucket/folder

const bucket = wrapBucket({ bucket: 'my-bucket-name', client, prefix: 'my/folder' })
// bucket.put/get/del

// see typings/typescript auto-complete for usage
```
