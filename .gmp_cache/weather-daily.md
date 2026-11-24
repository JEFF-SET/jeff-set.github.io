# Return a daily weather forecast for a set of latitude/longitude coordinates.

## Overview

The `forecast.days` (`lookup`) endpoint returns up to 10 days of daily weather
forecast information for a specified location, starting with the current day.

### Returned Data

For each forecast day, the API returns:

-   **Daytime (7:00 AM to 7:00 PM) and Nighttime (7:00 PM to 7:00 AM)
    forecasts**:
    -   Weather condition descriptions, types, and icon base URIs
    -   Relative humidity and UV index
    -   Precipitation probability (percentage and type) and Quantitative
        Precipitation Forecast (QPF)
    -   Thunderstorm probability
    -   Wind speed, wind gusts, and direction (degrees and cardinal)
    -   Visibility and cloud cover
-   **Daily temperature extremes**:
    -   Maximum and minimum temperatures
    -   Maximum and minimum apparent ("feels like") temperatures
    -   Maximum heat index and wind chill
-   **Environmental & Astronomical data**:
    -   Sea level pressure and ice thickness
    -   Sunrise, sunset, moonrise, and moonset times, plus moon phase
    -   Local time zone ID

--------------------------------------------------------------------------------

## Request Specification

### HTTP Endpoint

Send an HTTP `GET` request to:

```http
GET https://weather.googleapis.com/v1/forecast/days:lookup
```

### Required Headers

Include the Google Maps Platform usage attribution header in all requests:

Header                    | Value
:------------------------ | :-----------------------
`X-Goog-Maps-Solution-ID` | `gmp_git_agentskills_v1`

### Query Parameters

Parameter            | Type      | Required | Description
:------------------- | :-------- | :------- | :----------
`key`                | `string`  | **Yes**  | Your Google Maps Platform API key.
`location.latitude`  | `number`  | **Yes**  | The latitude coordinate of the target location.
`location.longitude` | `number`  | **Yes**  | The longitude coordinate of the target location.
`days`               | `integer` | No       | The total number of forecast days to return (up to `10`). Defaults to `10`.
`pageSize`           | `integer` | No       | The number of days to return per page. Defaults to `5`.
`pageToken`          | `string`  | No       | The `nextPageToken` value returned from a previous paginated response to retrieve the next page of results.

--------------------------------------------------------------------------------

## Implementation Examples

### 1. Basic Daily Forecast Request

Request a 2-day weather forecast for Mountain View, CA (`37.4220, -122.0841`):

#### cURL

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=2"
```

#### JavaScript (`fetch`)

```javascript
async function getDailyForecast(apiKey, latitude, longitude, days = 10) {
  const url = new URL('https://weather.googleapis.com/v1/forecast/days:lookup');
  url.searchParams.append('key', apiKey);
  url.searchParams.append('location.latitude', latitude);
  url.searchParams.append('location.longitude', longitude);
  url.searchParams.append('days', days);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'X-Goog-Maps-Solution-ID': 'gmp_git_agentskills_v1'
    }
  });

  if (!response.ok) {
    throw new Error(`Weather API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}
```

--------------------------------------------------------------------------------

### 2. Paginated Daily Forecast Request

By default, the endpoint returns up to 5 days per page (`pageSize=5`). If `days`
exceeds `pageSize`, the response includes a `nextPageToken`.

#### Step 1: Request the first page (6 days total, 3 days per page)

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=6&pageSize=3"
```

#### Step 2: Request the next page using `pageToken`

Pass the `nextPageToken` from the first response into the `pageToken` query
parameter:

```bash
curl -X GET \
  -H "X-Goog-Maps-Solution-ID: gmp_git_agentskills_v1" \
  "https://weather.googleapis.com/v1/forecast/days:lookup?key=YOUR_API_KEY&location.latitude=37.4220&location.longitude=-122.0841&days=6&pageSize=3&pageToken=ChYKEgm8dJMYBLZCQBH-ZffkYYVewBAGEAMYAyILCKyAqr0GEKOR6lUqE0FtZXJpY2EvTG9zX0FuZ2VsZXM="
```

> **Note:** Page tokens become invalid if weather data is unavailable for at
> least one of the hours in the specified time period. Passing an invalid token
> into `pageToken` returns an error.

--------------------------------------------------------------------------------

## Response Structure

Each item in the `forecastDays` array represents a single day (`interval` and
`displayDate`) split into `daytimeForecast` and `nighttimeForecast` objects.

```json
{
  "forecastDays": [
    {
      "interval": {
        "startTime": "2025-02-10T15:00:00Z",
        "endTime": "2025-02-11T15:00:00Z"
      },
      "displayDate": {
        "year": 2025,
        "month": 2,
        "day": 10
      },
      "daytimeForecast": {
        "interval": {
          "startTime": "2025-02-10T15:00:00Z",
          "endTime": "2025-02-11T03:00:00Z"
        },
        "weatherCondition": {
          "iconBaseUri": "https://maps.gstatic.com/weather/v1/partly_cloudy",
          "description": {
            "text": "Partly sunny",
            "languageCode": "en"
          },
          "type": "PARTLY_CLOUDY"
        },
        "relativeHumidity": 54,
        "uvIndex": 3,
        "precipitation": {
          "probability": {
            "percent": 5,
            "type": "RAIN"
          },
          "qpf": {
            "quantity": 0,
            "unit": "MILLIMETERS"
          }
        },
        "thunderstormProbability": 0,
        "wind": {
          "direction": {
            "degrees": 280,
            "cardinal": "WEST"
          },
          "speed": {
            "value": 6,
            "unit": "KILOMETERS_PER_HOUR"
          },
          "gust": {
            "value": 14,
            "unit": "KILOMETERS_PER_HOUR"
          }
        },
        "cloudCover": 53
      },
      "nighttimeForecast": {
        "interval": {
          "startTime": "2025-02-11T03:00:00Z",
          "endTime": "2025-02-11T15:00:00Z"
        },
        "weatherCondition": {
          "iconBaseUri": "https://maps.gstatic.com/weather/v1/partly_clear",
          "description": {
            "text": "Partly cloudy",
            "languageCode": "en"
          },
          "type": "PARTLY_CLOUDY"
        },
        "relativeHumidity": 85,
        "uvIndex": 0,
        "precipitation": {
          "probability": {
            "percent": 10,
            "type": "RAIN_AND_SNOW"
          },
          "qpf": {
            "quantity": 0,
            "unit": "MILLIMETERS"
          }
        },
        "thunderstormProbability": 0,
        "wind": {
          "direction": {
            "degrees": 201,
            "cardinal": "SOUTH_SOUTHWEST"
          },
          "speed": {
            "value": 6,
            "unit": "KILOMETERS_PER_HOUR"
          },
          "gust": {
            "value": 14,
            "unit": "KILOMETERS_PER_HOUR"
          }
        },
        "cloudCover": 70
      },
      "maxTemperature": {
        "degrees": 13.3,
        "unit": "CELSIUS"
      },
      "minTemperature": {
        "degrees": 1.5,
        "unit": "CELSIUS"
      },
      "feelsLikeMaxTemperature": {
        "degrees": 13.3,
        "unit": "CELSIUS"
      },
      "feelsLikeMinTemperature": {
        "degrees": 1.5,
        "unit": "CELSIUS"
      },
      "sunEvents": {
        "sunriseTime": "2025-02-10T15:02:35.703929582Z",
        "sunsetTime": "2025-02-11T01:43:00.762932858Z"
      },
      "moonEvents": {
        "moonPhase": "WAXING_GIBBOUS",
        "moonriseTimes": [
          "2025-02-10T23:54:17.713157984Z"
        ],
        "moonsetTimes": [
          "2025-02-10T14:13:58.625181191Z"
        ]
      },
      "maxHeatIndex": {
        "degrees": 13.3,
        "unit": "CELSIUS"
      },
      "iceThickness": {
        "thickness": 0,
        "unit": "MILLIMETERS"
      }
    }
  ],
  "timeZone": {
    "id": "America/Los_Angeles"
  },
  "nextPageToken": "ChYKEgm8dJMYBLZCQBH-ZffkYYVewBAGEAMYAyILCKyAqr0GEKOR6lUqE0FtZXJpY2EvTG9zX0FuZ2VsZXM="
}
```
