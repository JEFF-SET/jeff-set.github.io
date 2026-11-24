# Embed a Standard Google Maps View into an Iframe

This workflow details how to embed a standard interactive Google Map (`view`
mode) with no markers or directions into a web page using an HTML `<iframe>` and
JavaScript.

## Prerequisites

-   **Google Maps Platform API Key**: You must have a valid API key with the
    **Maps Embed API** enabled in your Google Cloud Console.
-   **API Key Restrictions**: Ensure your API key is restricted to your
    website's HTTP referrers (domains) for security.

## Implementation Workflow

### 1. Construct the Maps Embed API URL (`view` mode)

To display a clean map centered on a specific location without pins or routes,
use the `view` map mode.

The base URL structure is:

```
https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=LATITUDE,LONGITUDE&PARAMETERS&solution_id=gmp_git_agentskills_v1
```

#### Parameters for `view` Mode

| Parameter     | Requirement  | Description        | Accepted Values /        |
:               :              :                    : Example                  :
| :------------ | :----------- | :----------------- | :----------------------- |
| `key`         | **Required** | Your Google Maps   | `YOUR_API_KEY`           |
:               :              : Platform API key.  :                          :
| `center`      | **Required** | Defines the center | Comma-separated latitude |
:               :              : of the map view.   : and longitude (e.g.,     :
:               :              :                    : `-33.8569,151.2152` or   :
:               :              :                    : `37.4218,-122.0840`).    :
| `zoom`        | Optional     | Sets initial zoom  | `0` (whole world) to     |
:               :              : level of the map.  : `21` (individual         :
:               :              :                    : buildings). Example\:    :
:               :              :                    : `18`.                    :
| `maptype`     | Optional     | Defines type of    | `roadmap` (default) or   |
:               :              : map tiles to load. : `satellite`.             :
| `language`    | Optional     | Defines language   | Two-character language   |
:               :              : for UI elements    : code (e.g., `en`, `fr`,  :
:               :              : and map labels.    : `ja`).                   :
| `region`      | Optional     | Defines            | Two-character ccTLD      |
:               :              : appropriate        : region code (e.g., `US`, :
:               :              : borders and labels : `GB`, `AU`).             :
:               :              : based on           :                          :
:               :              : geopolitical       :                          :
:               :              : sensitivities.     :                          :
| `solution_id` | **Required** | Usage attribution  | `gmp_git_agentskills_v1` |
:               :              : parameter.         :                          :

### 2. Configure the HTML `<iframe>`

Embed the constructed URL into the `src` attribute of an `<iframe>` element.

#### Critical Iframe Requirements & Best Practices:

-   **Minimum Dimensions**: Embedded maps are **not supported** below a size of
    `200px` in either dimension (`width` and `height` must be $\ge 200$).
-   **Referrer Policy**: Always include
    `referrerpolicy="strict-origin-when-cross-origin"`. If your hosting website
    uses a restrictive `referrer` meta tag (like `no-referrer`), the browser
    will not send the `Referer` header, causing HTTP referrer-restricted API
    keys to reject the request.
-   **Styling & Fullscreen**: Use `style="border:0"` (and `frameborder="0"`) to
    remove standard iframe borders, and `allowfullscreen` to enable full-screen
    map controls.

--------------------------------------------------------------------------------

## Code Examples

### Static HTML Implementation

Use this snippet to directly embed a satellite view of Sydney, Australia into an
HTML document:

```html
<iframe
  width="600"
  height="450"
  frameborder="0"
  style="border:0"
  referrerpolicy="strict-origin-when-cross-origin"
  src="https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=-33.8569,151.2152&zoom=18&maptype=satellite&solution_id=gmp_git_agentskills_v1"
  allowfullscreen>
</iframe>
```

### Dynamic JavaScript Implementation

Use the following JavaScript helper function to dynamically generate and inject
a `view` mode map iframe into a DOM container. This approach ensures proper URL
encoding and enforces minimum dimension constraints.

```javascript
/**
 * Dynamically embeds a Google Maps 'view' mode iframe into a target DOM element.
 *
 * @param {string} containerId - The ID of the HTML element to mount the iframe into.
 * @param {Object} config - Configuration options for the map view.
 * @param {string} config.apiKey - Your Google Maps Platform API Key.
 * @param {number} config.lat - Latitude for the center of the map.
 * @param {number} config.lng - Longitude for the center of the map.
 * @param {number} [config.zoom=14] - Initial zoom level (0 to 21).
 * @param {'roadmap'|'satellite'} [config.maptype='roadmap'] - Map tile type.
 * @param {string} [config.language] - Optional language code (e.g., 'en', 'es').
 * @param {string} [config.region] - Optional 2-letter region code (e.g., 'US').
 * @param {number} [config.width=600] - Width of the iframe in pixels (minimum 200).
 * @param {number} [config.height=450] - Height of the iframe in pixels (minimum 200).
 */
function embedGoogleMapView(containerId, config) {
  const container = document.getElementById(containerId);
  if (!container) {
    console.error(`Container element with ID "${containerId}" not found.`);
    return;
  }

  if (!config.apiKey || typeof config.lat !== 'number' || typeof config.lng !== 'number') {
    console.error('Missing required configuration: apiKey, lat, and lng are required for view mode.');
    return;
  }

  // Enforce the 200px minimum dimension requirement for Maps Embed API
  const width = Math.max(config.width || 600, 200);
  const height = Math.max(config.height || 450, 200);

  // Build URL and query parameters
  const baseUrl = 'https://www.google.com/maps/embed/v1/view';
  const params = new URLSearchParams({
    key: config.apiKey,
    center: `${config.lat},${config.lng}`,
    solution_id: 'gmp_git_agentskills_v1'
  });

  if (config.zoom !== undefined) {
    params.append('zoom', String(config.zoom));
  }
  if (config.maptype) {
    params.append('maptype', config.maptype);
  }
  if (config.language) {
    params.append('language', config.language);
  }
  if (config.region) {
    params.append('region', config.region);
  }

  // Create and configure the iframe element
  const iframe = document.createElement('iframe');
  iframe.width = String(width);
  iframe.height = String(height);
  iframe.style.border = '0';
  iframe.setAttribute('frameborder', '0');
  iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  iframe.setAttribute('allowfullscreen', '');
  iframe.src = `${baseUrl}?${params.toString()}`;

  // Clear existing content and mount the iframe
  container.innerHTML = '';
  container.appendChild(iframe);
}

// Example Usage:
// Ensure you have <div id="map-container"></div> in your HTML
embedGoogleMapView('map-container', {
  apiKey: 'YOUR_API_KEY',
  lat: -33.8569,
  lng: 151.2152,
  zoom: 18,
  maptype: 'satellite',
  width: 600,
  height: 450
});
```

## Troubleshooting

-   **API Key Rejected / Referrer Error**: Verify that
    `referrerpolicy="strict-origin-when-cross-origin"` is present on the
    `<iframe>` tag and that your domain is properly listed in the Google Cloud
    Console HTTP referrer restrictions.
-   **Map Fails to Render properly**: Check that both the `width` and `height`
    of the `<iframe>` are at least `200` pixels.
-   **Blank Map or Invalid Request**: Confirm that the `center` parameter is
    formatted strictly as `LATITUDE,LONGITUDE` with no spaces between the comma
    and numbers (e.g., `37.4218,-122.0840`).
