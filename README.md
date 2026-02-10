# Open BMTC Geo API

Fast, bbox filtered GeoJSON API for BMTC routes and stops.  
Built for maps. Built for speed.

## DOCS AT https://open-bmtc-api.vercel.app/

![Land](./public/land.png)

## NEW v2: Database Implementation

Next commit brings faster API with MongoDB backend!

![Mongo DB](./public/mongo.png)

---

## Endpoints

**Base URL:**  
`https://open-bmtc-api.vercel.app`

### Core Data
- `GET /api/bmtc/routes`
- `GET /api/bmtc/stops`
- `GET /api/bmtc/aggregated`

### Info & Status
- `GET /api/meta`
- `GET /api/health`

---

## Query Parameters (where supported)

| Param      | Description |
|-----------|------------|
| `bbox`     | Bounding box filter: `minLng,minLat,maxLng,maxLat` |
| `routeId`  | Route identifier (example: `258-C`) |
| `simplify` | Line simplification tolerance (example: `0.0005`) |

---

## Example Requests

### Aggregated stops for a route
```
GET /api/bmtc/aggregated?routeId=258-C
```

### Aggregated stops inside a bounding box
```
GET /api/bmtc/aggregated?bbox=77.5,12.9,77.7,13.1
```

### Simplified route geometry
```
GET /api/bmtc/routes?routeId=258-C&simplify=0.0005
```

---

## Postman Example

**Request**
```
GET https://open-bmtc-api.vercel.app/api/bmtc/aggregated?routeId=258-C
```

**Response**
```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [77.5946, 12.9716]
      },
      "properties": {
        "name": "Majestic",
        "trip_count": 24,
        "route_list": ["258-C"]
      }
    }
  ]
}
```

---

## Meta & Health

### API Metadata
```
GET /api/meta
```
Returns dataset counts and supported features.

### Health Check
```
GET /api/health
```
Returns API + database status. Useful for uptime monitoring.

---

## Data & Architecture

- MongoDB-backed (GeoJSON stored as documents)
- 2dsphere indexes for fast spatial queries
- No external GeoJSON fetch at runtime
- Cached responses for app-safe usage

---

## Used By

This API is actively used by:  
https://github.com/jagath-sajjan/OPENBMTC
