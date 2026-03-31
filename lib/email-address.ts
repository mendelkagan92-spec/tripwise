import { randomBytes } from "crypto";

export function generateTripEmail(destination: string): string {
  const slug = destination
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 20);
  const id = randomBytes(4).toString("hex");
  return `${slug}-${id}@trips.tripwise.app`;
}
