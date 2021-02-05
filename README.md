# Calendar ADS

## Calendar Links

iOS
webcal://example.com/some_track_id/cal.ics

## .env Example

```.env
NODE_ENV=dev
MONGO_URL=mongodb://localhost:27017/calendar?retryWrites=true&w=majority
BINOM_URL=https://binom.org/click.php
CAL_CSV_URL=https://docs.google.com/spreadsheets/d/SOME_SHEET_ID/export?format=csv&id=SOME_SHEET_ID&gid=0
CAL_UPDATE_INTERVAL_MS=60000 
DOMAIN=example.com
REDIRECT_URL=http://localhost:3000/c/
REWARD_URL=https://example.com/?id=foobar
```

## Other

Request updates directive
REFRESH-INTERVAL;VALUE=DURATION:P60M
