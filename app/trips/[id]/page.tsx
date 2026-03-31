import { redirect } from "next/navigation";

export default function TripPage({ params }: { params: { id: string } }) {
  redirect(`/trips/${params.id}/itinerary`);
}
