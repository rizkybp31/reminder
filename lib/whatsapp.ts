export async function sendNotification(target: string | null, message: string) {
  if (!target) return;

  const cleanNumber = target.replace(/[^0-9]/g, "");
  const formattedTarget = cleanNumber.startsWith("0")
    ? "62" + cleanNumber.slice(1)
    : cleanNumber;

  try {
    const response = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN || "",
      },
      body: new URLSearchParams({
        target: formattedTarget,
        message: message,
        countryCode: "62",
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error("Fonnte Error:", error);
    return { status: false, error };
  }
}
