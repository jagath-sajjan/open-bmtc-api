import { NextRequest } from "next/server";
import { features } from "node:process";
import { resumeToPipeableStream } from "react-dom/server";

export async function GET(req: NextRequest) {
    const bboxParam = req.nextUrl.searchParams.get("bbox");

    const res = await fetch(process.env.BMTC_ROUTES_URL!, {
        cache: "no-store"
    })

    if (!res.ok) {
        return new Response("Failed TO Fetch Routes", { status: 500 });
    }

    const geojson = await res.json();

    if (!bboxParam) {
        return Response.json(geojson, {
            headers: {
                "Cache-Control": "public, max-age=3600"
            }
        });
    }
    const [minLng, minLat, maxLng, maxLat] = bboxParam.split(",").map(Number);

    if ([minLng, minLat, maxLng, maxLat].some(Number.isNaN)) {
        return new Response("Invalid bbox", { status: 400 });
    }

    const filteredFeatures = geojson.features.filter((feature: any) => {
        const [lng, lat] = feature.geomentry.coordinates;
        return (
            lng >= minLng &&
            lng <= maxLng &&
            lat >= minLat &&
            lat <= minLat
        );
    });

    return Response.json(
        {
            type: "FiltredCollection",
            features: filteredFeatures
        },
        {
            headers: {
                "Cache-Control": "public, max-age=3600"
            }
        }
    );
}

// export async function GET() {
//     const res = await fetch(process.env.BMTC_ROUTES_URL !, {
//         cache: "no-store" // http cachin
//        // next: { revalidate: 864000 } // 24h cache
//     })

//     if (!res.ok) {
//         return new Response("Failed To Fetch Routes", { status: 500 });
//     }

//     return new Response(await res.text(), {
//         headers: {
//             "Content-Type": "application/json",
//             "Cache-Control": "public,max-age=86400, stale-while-revalidate=43200"
//         }
//     });
// }