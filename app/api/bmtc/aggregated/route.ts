import { NextRequest } from "next/server";
import clientPromise from "@/lib/mongo";

export const runtime = "nodejs";

// helper func
function simplifyLineString(coordinates: number[][], tolerance: number) {
  if (coordinates.length <= 2) return coordinates;

  const simplified: number[][] = [coordinates[0]];
  let lastKept = coordinates[0];

  for (let i = 1; i < coordinates.length - 1; i++) {
    const [lng, lat] = coordinates[i];
    const [lastLng, lastLat] = lastKept;

    if (Math.abs(lng - lastLng) + Math.abs(lat - lastLat) >= tolerance) {
      simplified.push(coordinates[i]);
      lastKept = coordinates[i];
    }
  }

  simplified.push(coordinates[coordinates.length - 1]);
  return simplified;
}

export async function GET(req: NextRequest) {
  const routeId = req.nextUrl.searchParams.get("routeId");
  const simplifyParam = req.nextUrl.searchParams.get("simplify");
  const simplifyTolerance = simplifyParam ? Number(simplifyParam) : null;
  const bboxParam = req.nextUrl.searchParams.get("bbox");

  const normalizedRouteId = routeId
    ? routeId
        .toUpperCase()
        .trim()
        .replace(/\s+/g, "")
        .replace(/^(\d+)([A-Z])$/, "$1-$2")
    : null;

  const client = await clientPromise;
  const db = client.db("bmtc");
  const collection = db.collection("aggregated");

  const query: any = {};

  if (normalizedRouteId) {
    query.route_list = normalizedRouteId;
  }

  if (bboxParam) {
    const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
      return new Response("Invalid bbox", { status: 400 });
    }

    query.geometry = {
      $geoWithin: {
        $box: [
          [minLng, minLat],
          [maxLng, maxLat]
        ]
      }
    };
  }

  const docs = await collection
    .find(query, {
      projection: {
        _id: 0,
        name: 1,
        geometry: 1,
        route_list: 1,
        route_count: 1
      }
    })
    .limit(500)
    .toArray();

  let features = docs.map((doc: any) => ({
    type: "Feature",
    geometry: doc.geometry,
    properties: {
      name: doc.name,
      route_count: doc.route_count,
      route_list: doc.route_list
    }
  }));

  if (simplifyTolerance) {
    features = features.map((f: any) =>
      f.geometry.type !== "LineString"
        ? f
        : {
            ...f,
            geometry: {
              ...f.geometry,
              coordinates: simplifyLineString(
                f.geometry.coordinates,
                simplifyTolerance
              )
            }
          }
    );
  }

  return Response.json(
    {
      type: "FeatureCollection",
      features,
      meta: {
        count: features.length,
        routeId: normalizedRouteId,
        bbox: bboxParam,
        simplified: !!simplifyTolerance
      }
    },
    {
      headers: {
        "Cache-Control": "public, max-age=3600"
      }
    }
  );
}


// export async function GET() {
//     const res = await fetch(process.env.BMTC_AGGREGATED_URL!, {
//         cache: "no-store" // http cache
//         // next: { revalidate: 864000 } // 24h cache
//     });

//     if (!res.ok) {
//         return new Response("Failed To Fetch AggStops", { status: 500 });
//     }

//     return new Response(await res.text(), {
//         headers: {
//             "Content-Type": "applications/json",
//             "Cache-Control": "public,max-age=86400, stale-while-revalidate=43200"
//         }
//     });
// }