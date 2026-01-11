import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

function toIsoOrNull(v: any) {
  // Firestore Timestamp (Admin)
  if (v && typeof v.toDate === "function") return v.toDate().toISOString();

  // { seconds, nanoseconds }
  if (v && typeof v.seconds === "number")
    return new Date(v.seconds * 1000).toISOString();

  return null;
}

function mapDoc(doc: QueryDocumentSnapshot) {
  const data: any = doc.data();
  const createdAt = toIsoOrNull(data.createdAt);
  const updatedAt = toIsoOrNull(data.updatedAt);

  return {
    id: doc.id,
    ...data,
    createdAt,
    updatedAt,
  };
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const featuredOnly = Boolean(body?.featuredOnly);

    let q = getAdminDb().collection("skills").orderBy("order", "asc");
    if (featuredOnly) q = q.where("featured", "==", true);

    const snap = await q.get();
    const skills = snap.docs.map(mapDoc);

    return NextResponse.json({ skills });
  } catch (error: any) {
    console.error("Error fetching skills:", error);
    return NextResponse.json(
      { skills: [], error: error?.message ?? "Unknown error" },
      { status: 500 }
    );
  }
}
