import { NextResponse } from "next/server";
import pdf from "pdf-parse";
import fs from "fs";
import path from "path";

export async function POST(req: Request) {
  try {
    const { query } = await req.json();
    const pdfFiles = ["eldad_yikne_cv.pdf", "Profile.pdf"];
    let allParagraphs: string[] = [];

    for (const fileName of pdfFiles) {
      const pdfPath = path.join(process.cwd(), "data", fileName);
      if (fs.existsSync(pdfPath)) {
        const dataBuffer = fs.readFileSync(pdfPath);
        const data = await pdf(dataBuffer);
        const paragraphs = data.text.split(/\n\s*\n/);
        allParagraphs = [...allParagraphs, ...paragraphs];
      }
    }
    console.log("query", query);
    return NextResponse.json({
      content: [
        {
          type: "text",
          text: allParagraphs,
        },
      ],
    });
  } catch (err) {
    return NextResponse.json({ text: "שגיאה בניתוח הקבצים" }, { status: 500 });
  }
}
