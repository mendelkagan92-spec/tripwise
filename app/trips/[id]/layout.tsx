import BottomNav from "@/components/BottomNav";

export default function TripLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <div className="min-h-screen pb-20">
      {children}
      <BottomNav tripId={params.id} />
    </div>
  );
}
