# `aws-info`

Information about AWS as structured data needed for operating @tradle-mycloud

## Usage

```js
const { regions, countries, regionByCode, regionByIdx, countryById } = require('aws-info')

// regions contains a list fof
const region = awsInfo.regions[0]

region.code === 'us-east-1'
region.idx === '0' // Short consistent identifier! @tradle/aws-info specific!

region.loc?.latitude === 38.99
region.loc?.longitude === -77.45

// The same region call also be accessed through regionByCode, regionByIdx:
region === regionByCode[region.code] === regionByIdx[region.idx]

// Some regions may not support ses/sns, in that case a "fallback" property is present
regionByCode['ap-southeast-3'].fallback.ses === 'ap-southeast-1'

// For some features (specfically sms) the country codes and their phone numbers
// are needed.
const country = countries[0]
country.id === 'AW'
country.cca3 === 'ABW'
country.callingCodes === [ '297' ]
country.title === 'Aruba'
country.loc === {
  latitude: 12.5,
  longitude: -69.97
}
country.sms === {
  senderID: SenderID.Available,
  twoWaySMS: false
}

// Countries can also be access through their ID
country === countryById[country.id]
```

# License

MIT
