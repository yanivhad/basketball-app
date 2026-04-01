import cron from "node-cron";
import prisma from "../prismaClient.js";
import { sendWhatsApp } from "./whatsapp.js";

function isWithinWindow(sessionDate, minutesBefore, toleranceMinutes = 5) {
  const now = new Date();
  const target = new Date(sessionDate.getTime() - minutesBefore * 60 * 1000);
  const diff = Math.abs(now - target);
  return diff <= toleranceMinutes * 60 * 1000;
}

function buildMessage(user, session) {
  const time = new Date(session.date).toLocaleTimeString("en-GB", {
    hour: "2-digit", minute: "2-digit",
  });
  const location = session.location ? `📍 ${session.location}` : "";
  return `🏀 Hey ${user.name}! Game night is tonight at ${time}${location ? " · " + location : ""}. See you on the court! 💪`;
}

export function startScheduler() {
  // Runs every 5 minutes
  cron.schedule("*/5 * * * *", async () => {
    try {
      const sessions = await prisma.session.findMany({
        where: { status: "upcoming" },
        include: {
          attendance: {
            where: { confirmed: true },
            include: { user: true },
          },
        },
      });

      for (const session of sessions) {
        for (const att of session.attendance) {
          const user = att.user;
          if (!user.whatsappAlerts || !user.whatsappNumber) continue;

          const timing = user.alertTiming;
          let shouldSend = false;

          if (timing === "one_hour")    shouldSend = isWithinWindow(session.date, 60);
          if (timing === "three_hours") shouldSend = isWithinWindow(session.date, 180);
          if (timing === "morning") {
            // Send at 9am on the day of the game
            const now = new Date();
            const gameDay = new Date(session.date);
            const sameDay =
              now.getFullYear() === gameDay.getFullYear() &&
              now.getMonth()    === gameDay.getMonth() &&
              now.getDate()     === gameDay.getDate();
            shouldSend = sameDay && now.getHours() === 9 && now.getMinutes() < 5;
          }

          if (shouldSend) {
            const msg = buildMessage(user, session);
            await sendWhatsApp(user.whatsappNumber, msg);
          }
        }
      }
    } catch (err) {
      console.error("Scheduler error:", err.message);
    }
  });

  console.log("⏰ WhatsApp reminder scheduler started");
}