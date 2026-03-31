import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/postmark";

function formatEventHtml(events: { name: string; type: string; time: string | null; location: string | null; confirmationNumber: string | null }[]): string {
  return events
    .map(
      (e) => `
        <div style="padding: 12px; margin-bottom: 8px; background: #f8f9fa; border-radius: 8px;">
          <strong>${e.name}</strong> <span style="color: #6b7280;">(${e.type})</span><br/>
          ${e.time ? `<span>Time: ${e.time}</span><br/>` : ""}
          ${e.location ? `<span>Location: ${e.location}</span><br/>` : ""}
          ${e.confirmationNumber ? `<span>Confirmation: ${e.confirmationNumber}</span>` : ""}
        </div>
      `
    )
    .join("");
}

export async function POST(req: NextRequest) {
  // Verify this is called by Vercel Cron or has authorization
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStart = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());
    const tomorrowEnd = new Date(tomorrowStart);
    tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);

    // Day-before reminders: find events happening tomorrow
    const tomorrowEvents = await prisma.event.findMany({
      where: {
        date: {
          gte: tomorrowStart,
          lt: tomorrowEnd,
        },
      },
      include: {
        trip: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
      orderBy: { time: "asc" },
    });

    // Group by user
    const byUser: Record<string, { email: string; name: string | null; tripName: string; events: typeof tomorrowEvents }> = {};
    for (const event of tomorrowEvents) {
      const userId = event.trip.userId;
      if (!byUser[userId]) {
        byUser[userId] = {
          email: event.trip.user.email,
          name: event.trip.user.name,
          tripName: event.trip.name,
          events: [],
        };
      }
      byUser[userId].events.push(event);
    }

    let sentCount = 0;

    // Send day-before summary emails
    for (const user of Object.values(byUser)) {
      const eventsHtml = formatEventHtml(user.events);

      try {
        await sendEmail({
          to: user.email,
          subject: `Tripwise: Tomorrow's itinerary for ${user.tripName}`,
          htmlBody: `
            <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
              <h2 style="color: #6366f1;">Tomorrow's Plan</h2>
              <p>Hi ${user.name || "there"}, here's what's on your itinerary for tomorrow:</p>
              ${eventsHtml}
              <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                — Tripwise
              </p>
            </div>
          `,
        });
        sentCount++;
      } catch (error) {
        console.error(`Failed to send email to ${user.email}:`, error);
      }
    }

    // Flight reminders: find flights in the next 3 hours
    const threeHoursFromNow = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const upcomingFlights = await prisma.event.findMany({
      where: {
        type: "Flight",
        date: {
          gte: todayStart,
          lt: todayEnd,
        },
      },
      include: {
        trip: {
          include: {
            user: { select: { email: true, name: true } },
          },
        },
      },
    });

    // Filter flights happening in the next 3 hours
    for (const flight of upcomingFlights) {
      if (!flight.time) continue;

      const [hours, minutes] = flight.time.split(":").map(Number);
      const flightTime = new Date(todayStart);
      flightTime.setHours(hours, minutes, 0, 0);

      if (flightTime > now && flightTime <= threeHoursFromNow) {
        try {
          await sendEmail({
            to: flight.trip.user.email,
            subject: `Tripwise: Flight reminder - ${flight.name}`,
            htmlBody: `
              <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
                <h2 style="color: #3b82f6;">✈️ Flight Reminder</h2>
                <p>Hi ${flight.trip.user.name || "there"}, your flight is coming up:</p>
                <div style="padding: 16px; background: #f0f9ff; border-radius: 8px; border-left: 4px solid #3b82f6;">
                  <strong>${flight.name}</strong><br/>
                  <span>Time: ${flight.time}</span><br/>
                  ${flight.location ? `<span>Location: ${flight.location}</span><br/>` : ""}
                  ${flight.confirmationNumber ? `<span>Confirmation: ${flight.confirmationNumber}</span>` : ""}
                </div>
                <p style="color: #6b7280; font-size: 14px; margin-top: 24px;">
                  — Tripwise
                </p>
              </div>
            `,
          });
          sentCount++;
        } catch (error) {
          console.error(`Failed to send flight reminder to ${flight.trip.user.email}:`, error);
        }
      }
    }

    return NextResponse.json({ success: true, sent: sentCount });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
