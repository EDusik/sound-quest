import { NextResponse } from "next/server";
import type { ZodError } from "zod";

export function jsonUnauthorized() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

export function jsonForbidden() {
  return NextResponse.json({ error: "forbidden" }, { status: 403 });
}

export function jsonValidationError(error: ZodError) {
  return NextResponse.json(
    { error: "validation_error", details: error.flatten() },
    { status: 400 },
  );
}

export function jsonServerError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status });
}
